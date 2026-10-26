import { FilePatch } from '@ultrapie/shared';
import * as path from 'path';

export class PatchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PatchValidationError';
  }
}

const FORBIDDEN_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^id_rsa/i,
  /^id_ed25519/i,
  /\.pem$/i,
  /\.key$/i,
  /^\/?etc\//i,
  /node_modules/i,
  /^\.git\//i,
];

export class PatchValidator {
  /**
   * Validates a batch of file patches proposed by AI.
   * Enforces path containment within project root and blocks forbidden files.
   */
  static validate(patches: FilePatch[]): void {
    if (!Array.isArray(patches)) {
      throw new PatchValidationError('Patches must be an array');
    }

    // Empty patches is valid for normal conversational dialogue
    if (patches.length === 0) {
      return;
    }

    for (const patch of patches) {
      if (!patch.path || typeof patch.path !== 'string') {
        throw new PatchValidationError('Patch missing valid relative path');
      }

      // Normalize path
      const normalized = path.normalize(patch.path).replace(/^[/\\]+/, '');

      // Path traversal check
      if (normalized.startsWith('..') || path.isAbsolute(patch.path)) {
        throw new PatchValidationError(
          `Path traversal exploit detected in patch path: ${patch.path}`
        );
      }

      // Forbidden secret or system file checks
      const basename = path.basename(normalized);
      for (const pattern of patternMatches(basename, normalized)) {
        if (pattern) {
          throw new PatchValidationError(
            `Blocked attempt to modify protected or forbidden file: ${patch.path}`
          );
        }
      }

      // Operation check
      if (!['create', 'update', 'delete'].includes(patch.operation)) {
        throw new PatchValidationError(`Invalid operation: ${patch.operation}`);
      }

      // Content requirement
      if ((patch.operation === 'create' || patch.operation === 'update') && typeof patch.content !== 'string') {
        throw new PatchValidationError(`Patch for ${patch.path} requires content string`);
      }
    }
  }

  /**
   * Applies validated patches to an in-memory virtual file system representation.
   */
  static applyPatches(
    currentFiles: Record<string, string>,
    patches: FilePatch[]
  ): Record<string, string> {
    this.validate(patches);
    const updated = { ...currentFiles };

    for (const patch of patches) {
      const normalized = path.normalize(patch.path).replace(/^[/\\]+/, '').replace(/\\/g, '/');
      if (patch.operation === 'delete') {
        delete updated[normalized];
      } else if (patch.operation === 'create' || patch.operation === 'update') {
        updated[normalized] = patch.content || '';
      }
    }

    return updated;
  }
}

function* patternMatches(basename: string, fullPath: string) {
  for (const pattern of FORBIDDEN_FILE_PATTERNS) {
    if (pattern.test(basename) || pattern.test(fullPath)) {
      yield true;
    }
  }
}
