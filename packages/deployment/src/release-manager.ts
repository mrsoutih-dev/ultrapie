import * as crypto from 'crypto';
import { BuildExecutionResult, ReleaseDescriptor } from './types.js';

export class ReleaseManager {
  private releases: Map<string, ReleaseDescriptor> = new Map();
  private activeReleaseByProject: Map<string, string> = new Map();

  /**
   * Processes the outcome of a build job.
   * If successful: creates an immutable release.
   * If failed: safely records failure logs without affecting active release.
   */
  processBuildOutcome(
    projectId: string,
    result: BuildExecutionResult,
    autoPromoteToProduction = false
  ): ReleaseDescriptor | null {
    if (result.status === 'FAILED') {
      // CRITICAL SECURITY RULE: Failed build must NEVER replace the active production release!
      return null;
    }

    const releaseId = `rel_${crypto.randomBytes(8).toString('hex')}`;
    const storageKey = `releases/${projectId}/${result.commitSha}`;
    const releaseUrl = `https://preview-${result.deploymentId.substring(0, 8)}.ultrapie.app`;

    const descriptor: ReleaseDescriptor = {
      releaseId,
      deploymentId: result.deploymentId,
      projectId,
      storageKey,
      releaseUrl,
      commitSha: result.commitSha,
      isActive: false,
      createdAt: new Date().toISOString(),
    };

    this.releases.set(releaseId, descriptor);

    if (autoPromoteToProduction) {
      this.promoteReleaseToProduction(projectId, releaseId);
    }

    return descriptor;
  }

  /**
   * Promotes an existing release to the live production endpoint.
   */
  promoteReleaseToProduction(projectId: string, releaseId: string): ReleaseDescriptor {
    const release = this.releases.get(releaseId);
    if (!release || release.projectId !== projectId) {
      throw new Error(`Release ${releaseId} not found for project ${projectId}`);
    }

    // Deactivate previous active release
    const currentActiveId = this.activeReleaseByProject.get(projectId);
    if (currentActiveId && this.releases.has(currentActiveId)) {
      this.releases.get(currentActiveId)!.isActive = false;
    }

    // Activate new release
    release.isActive = true;
    this.activeReleaseByProject.set(projectId, releaseId);

    return release;
  }

  /**
   * One-click rollback to a specific prior release.
   */
  rollbackToRelease(projectId: string, targetReleaseId: string): ReleaseDescriptor {
    return this.promoteReleaseToProduction(projectId, targetReleaseId);
  }

  getActiveRelease(projectId: string): ReleaseDescriptor | null {
    const activeId = this.activeReleaseByProject.get(projectId);
    if (!activeId) return null;
    return this.releases.get(activeId) || null;
  }

  getProjectReleases(projectId: string): ReleaseDescriptor[] {
    return Array.from(this.releases.values()).filter((r) => r.projectId === projectId);
  }
}
