import { NextRequest, NextResponse } from 'next/server';
import {
  getDeployments,
  getDeploymentBySlug,
  createDeployment,
  updateDeployment,
  rollbackDeployment,
  deleteDeployment,
  isSlugAvailable,
  createBranchDeployment,
} from '@/lib/hosting/edge-deployments';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    const checkSlug = searchParams.get('checkSlug');

    if (checkSlug) {
      const result = isSlugAvailable(checkSlug, id || undefined);
      return NextResponse.json(result);
    }

    if (slug || id) {
      const dep = getDeploymentBySlug(slug || id || '');
      if (!dep) {
        return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
      }
      return NextResponse.json({ deployment: dep });
    }

    const deployments = getDeployments();
    return NextResponse.json({
      deployments,
      total: deployments.length,
      edgeTotal: deployments.filter((d) => d.type === 'edge').length,
      coolifyTotal: deployments.filter((d) => d.type === 'coolify').length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, files, type = 'edge', framework, envVars, action, baseSlug, branchName, id } = body;

    if (action === 'branchDeploy') {
      if (!baseSlug || !branchName) {
        return NextResponse.json({ error: 'Missing baseSlug or branchName' }, { status: 400 });
      }
      const branchDep = createBranchDeployment(baseSlug, branchName, files);
      if (!branchDep) {
        return NextResponse.json({ error: 'Base deployment not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        deployment: branchDep,
        url: `/preview/${branchDep.slug}`,
        subdomainUrl: `https://${branchDep.subdomain}`,
        message: `Branch preview live at https://${branchDep.subdomain}!`,
      });
    }

    if (action === 'simulateGitPush') {
      if (!id) {
        return NextResponse.json({ error: 'Missing deployment id' }, { status: 400 });
      }
      const dep = getDeploymentBySlug(id);
      if (!dep) {
        return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
      }
      const updated = updateDeployment(dep.id, {
        version: dep.version + 1,
        updatedAt: new Date().toISOString(),
      });
      if (updated) {
        updated.logs.unshift({
          timestamp: new Date().toISOString(),
          level: 'success',
          message: `[GitHub Webhook] Push to branch "${dep.gitBranch || 'main'}" received. Zero-downtime rebuild published v${updated.version}.`,
        });
      }
      return NextResponse.json({
        success: true,
        deployment: updated,
        message: `Rebuild triggered from Git push on ${dep.gitBranch || 'main'}!`,
      });
    }

    if (!name || !files || typeof files !== 'object') {
      return NextResponse.json(
        { error: 'Missing required fields: name and files object' },
        { status: 400 }
      );
    }

    const deployment = createDeployment({
      name,
      files,
      type,
      framework,
      envVars,
    });

    return NextResponse.json({
      success: true,
      deployment,
      url: `/preview/${deployment.slug}`,
      subdomainUrl: `https://${deployment.subdomain}`,
      message: `Deployed to ${deployment.subdomain} successfully!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create deployment' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, updates, version } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing deployment id' }, { status: 400 });
    }

    if (action === 'rollback') {
      if (!version) {
        return NextResponse.json({ error: 'Missing target version for rollback' }, { status: 400 });
      }
      const rolledBack = rollbackDeployment(id, Number(version));
      if (!rolledBack) {
        return NextResponse.json({ error: 'Rollback target version not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, deployment: rolledBack, message: `Rolled back to v${version}` });
    }

    const updated = updateDeployment(id, updates || {});
    if (!updated) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deployment: updated, message: 'Deployment updated successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update deployment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing deployment id' }, { status: 400 });
    }

    const deleted = deleteDeployment(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deployment deleted successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete deployment' },
      { status: 500 }
    );
  }
}
