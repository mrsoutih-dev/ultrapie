import { NextRequest, NextResponse } from 'next/server';

interface CoolifyRequest {
  coolifyUrl?: string;
  token?: string;
  action: 'ping' | 'servers' | 'applications' | 'projects' | 'deploy' | 'createApp';
  appUuid?: string;
  payload?: any;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CoolifyRequest;
    const { action, appUuid, payload } = body;

    let coolifyUrl =
      body.coolifyUrl?.trim() ||
      process.env.COOLIFY_URL?.trim() ||
      'http://127.0.0.1:8000';
    let token =
      body.token?.trim() ||
      process.env.COOLIFY_TOKEN?.trim() ||
      '6|9gNNiFPNnxeA3Yk7O83K5ijExdoQpMP2zTIYoJBi';

    // Remove trailing slash from URL
    if (coolifyUrl && coolifyUrl.endsWith('/')) {
      coolifyUrl = coolifyUrl.slice(0, -1);
    }

    // Demo mock data to provide immediate rich preview if not configured
    const mockServers = [
      {
        id: 1,
        uuid: 'srv-primary-01',
        name: 'Production VPS (Ubuntu 24.04)',
        ip: '198.51.100.42',
        status: 'healthy',
        is_reachable: true,
        cpu_usage: '24%',
        memory_usage: '4.2GB / 16GB',
        docker_version: '27.1.1',
      },
      {
        id: 2,
        uuid: 'srv-staging-02',
        name: 'Staging Worker (Hetzner CPX31)',
        ip: '203.0.113.88',
        status: 'healthy',
        is_reachable: true,
        cpu_usage: '12%',
        memory_usage: '1.8GB / 8GB',
        docker_version: '27.0.3',
      },
    ];

    const mockApplications = [
      {
        id: 101,
        uuid: 'app-counter-demo',
        name: 'Ultrapie Counter App',
        status: 'running',
        fqdn: 'https://counter.ultrapie.com',
        git_repository: 'https://github.com/ultrapie-team/simple-counter-app',
        git_branch: 'main',
        build_pack: 'nixpacks',
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        server_name: 'Production VPS (Ubuntu 24.04)',
      },
      {
        id: 102,
        uuid: 'app-api-gateway',
        name: 'Fastify API Microservice',
        status: 'running',
        fqdn: 'https://api.ultrapie.com',
        git_repository: 'https://github.com/ultrapie-team/api-gateway',
        git_branch: 'main',
        build_pack: 'dockerfile',
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        server_name: 'Production VPS (Ubuntu 24.04)',
      },
      {
        id: 103,
        uuid: 'app-redis-cache',
        name: 'Redis Cache Cluster',
        status: 'running',
        fqdn: 'redis://cache.internal:6379',
        git_repository: 'docker.io/library/redis:alpine',
        git_branch: 'latest',
        build_pack: 'dockerimage',
        updated_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        server_name: 'Production VPS (Ubuntu 24.04)',
      },
    ];

    // If no credentials supplied or demo requested
    if (!coolifyUrl || !token) {
      if (action === 'ping') {
        return NextResponse.json({
          status: 'simulated',
          message: 'Running in preview / demo mode. Enter your Coolify Server URL & API Token to connect live.',
          version: 'v4.0.0-beta.350 (Demo)',
          connected: false,
        });
      }
      if (action === 'servers') {
        return NextResponse.json({ servers: mockServers, isDemo: true });
      }
      if (action === 'applications') {
        return NextResponse.json({ applications: mockApplications, isDemo: true });
      }
      if (action === 'deploy') {
        return NextResponse.json({
          success: true,
          deployment_id: 'dep-' + Math.random().toString(36).substring(2, 9),
          message: `Deployment triggered successfully for app ${appUuid || 'demo'} (Simulated)`,
          isDemo: true,
        });
      }
      if (action === 'createApp') {
        const appName = payload?.name || 'New Coolify App';
        const newApp = {
          id: Math.floor(Math.random() * 900) + 200,
          uuid: 'app-' + Math.random().toString(36).substring(2, 9),
          name: appName,
          status: 'running',
          fqdn: payload?.fqdn || `https://${appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ultrapie.com`,
          git_repository: payload?.git_repository || 'https://github.com/user/simple-counter-app',
          git_branch: payload?.git_branch || 'main',
          build_pack: payload?.build_pack || 'nixpacks',
          updated_at: new Date().toISOString(),
          server_name: payload?.server_name || 'Production VPS (Ubuntu 24.04)',
        };
        return NextResponse.json({
          success: true,
          application: newApp,
          message: `Application "${newApp.name}" created and deployed on Coolify successfully!`,
          isDemo: true,
        });
      }
      return NextResponse.json({ success: true, isDemo: true });
    }

    // Live Coolify API integration
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    switch (action) {
      case 'ping': {
        const testRes = await fetch(`${coolifyUrl}/api/v1/version`, {
          headers,
          signal: AbortSignal.timeout(6000),
        }).catch(async () => {
          // Fallback to /api/v1/servers if /version is disabled
          return fetch(`${coolifyUrl}/api/v1/servers`, {
            headers,
            signal: AbortSignal.timeout(6000),
          });
        });

        if (!testRes.ok) {
          const errText = await testRes.text();
          return NextResponse.json(
            {
              connected: false,
              message: `Coolify returned HTTP ${testRes.status}: ${errText || testRes.statusText}`,
            },
            { status: testRes.status }
          );
        }

        const data = await testRes.json().catch(() => ({ version: 'Connected' }));
        return NextResponse.json({
          connected: true,
          version: data.version || 'v4.x',
          message: 'Successfully connected to live Coolify instance!',
        });
      }

      case 'servers': {
        const res = await fetch(`${coolifyUrl}/api/v1/servers`, {
          headers,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch servers: HTTP ${res.status}`);
        }
        const data = await res.json();
        return NextResponse.json({ servers: data, isDemo: false });
      }

      case 'applications': {
        const res = await fetch(`${coolifyUrl}/api/v1/applications`, {
          headers,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch applications: HTTP ${res.status}`);
        }
        const data = await res.json();
        return NextResponse.json({ applications: data, isDemo: false });
      }

      case 'deploy': {
        if (!appUuid) {
          return NextResponse.json({ error: 'Missing application UUID for deployment' }, { status: 400 });
        }
        const res = await fetch(`${coolifyUrl}/api/v1/deploy?uuid=${encodeURIComponent(appUuid)}`, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed to trigger deployment: HTTP ${res.status} - ${errText}`);
        }
        const data = await res.json().catch(() => ({ success: true }));
        return NextResponse.json({
          success: true,
          data,
          message: `Deployment triggered successfully on Coolify!`,
          isDemo: false,
        });
      }

      case 'createApp': {
        const appPayload = { ...payload };

        // Auto-resolve server_uuid if missing
        if (!appPayload.server_uuid) {
          const srvRes = await fetch(`${coolifyUrl}/api/v1/servers`, { headers, signal: AbortSignal.timeout(5000) }).catch(() => null);
          if (srvRes && srvRes.ok) {
            const srvs = await srvRes.json();
            if (Array.isArray(srvs) && srvs.length > 0) {
              appPayload.server_uuid = srvs[0].uuid;
            }
          }
        }

        const res = await fetch(`${coolifyUrl}/api/v1/applications/public`, {
          method: 'POST',
          headers,
          body: JSON.stringify(appPayload),
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Failed to create application on Coolify: HTTP ${res.status} - ${err}`);
        }

        const data = await res.json();
        const appUuid = data.uuid || data.id;

        // Auto-trigger deployment if requested
        let deployResult = null;
        if (appPayload.autoDeploy !== false && appUuid) {
          const deployRes = await fetch(`${coolifyUrl}/api/v1/deploy?uuid=${encodeURIComponent(appUuid)}`, {
            method: 'POST',
            headers,
            signal: AbortSignal.timeout(10000),
          }).catch(() => null);
          if (deployRes && deployRes.ok) {
            deployResult = await deployRes.json().catch(() => ({ status: 'queued' }));
          }
        }

        return NextResponse.json({
          success: true,
          application: data,
          deployment: deployResult,
          message: `Application "${appPayload.name || 'App'}" created and deployment queued on Coolify!`,
          isDemo: false,
        });
      }

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Coolify proxy error:', error);
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Coolify API communication failure',
      },
      { status: 500 }
    );
  }
}
