import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../apps/web/src/app/api/coolify/route';

describe('Coolify Application Deployment API (/api/coolify)', () => {
  it('should create an application in demo/preview mode with normalized domains and fqdn', async () => {
    const req = new NextRequest('http://localhost:3000/api/coolify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isDemo: true,
        action: 'createApp',
        payload: {
          name: 'Simple Counter App',
          git_repository: 'https://github.com/ultrapie-team/simple-counter-app',
          git_branch: 'main',
          build_pack: 'nixpacks',
          fqdn: 'https://counter.ultrapie.com',
          ports_exposes: '3000',
          autoDeploy: true,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.application).toBeDefined();
    expect(data.application.name).toBe('Simple Counter App');
    expect(data.application.fqdn).toBe('https://counter.ultrapie.com');
    expect(data.isDemo).toBe(true);
  });

  it('should support fetching projects in demo mode', async () => {
    const req = new NextRequest('http://localhost:3000/api/coolify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isDemo: true,
        action: 'projects',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.projects)).toBe(true);
    expect(data.projects.length).toBeGreaterThan(0);
  });

  it('should sanitize payload for live Coolify 4.5+ by auto-resolving project_uuid, mapping fqdn to domains, and removing autoDeploy', async () => {
    // Mock global fetch to intercept requests to Coolify API
    const capturedRequests: { url: string; method: string; body?: any }[] = [];

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      const method = init?.method || 'GET';
      const body = init?.body ? JSON.parse(init.body as string) : undefined;
      capturedRequests.push({ url: urlStr, method, body });

      if (urlStr.includes('/api/v1/servers')) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ uuid: 'srv-live-test-01', name: 'Primary Server' }],
        };
      }

      if (urlStr.includes('/api/v1/projects')) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ uuid: 'proj-live-test-01', name: 'Default Project' }],
        };
      }

      if (urlStr.includes('/api/v1/applications/public')) {
        // Assert that forbidden fields are removed and required fields are injected!
        expect(body).toBeDefined();
        expect(body.server_uuid).toBe('srv-live-test-01');
        expect(body.project_uuid).toBe('proj-live-test-01');
        expect(body.environment_name).toBe('production');
        expect(body.domains).toBe('https://app.yourdomain.com');
        expect(body.fqdn).toBeUndefined(); // Must NOT send fqdn
        expect(body.autoDeploy).toBeUndefined(); // Must NOT send autoDeploy

        return {
          ok: true,
          status: 201,
          json: async () => ({
            uuid: 'app-live-created-99',
            name: body.name,
            domains: body.domains,
          }),
        };
      }

      if (urlStr.includes('/api/v1/deploy')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'queued', deployment_uuid: 'dep-99' }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
    }) as any;

    try {
      const req = new NextRequest('http://localhost:3000/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coolifyUrl: 'http://coolify-test-host:8000',
          token: 'valid-test-token-12345',
          action: 'createApp',
          payload: {
            name: 'Simple Counter App',
            git_repository: 'https://github.com/ultrapie-team/simple-counter-app',
            git_branch: 'main',
            build_pack: 'nixpacks',
            fqdn: 'https://app.yourdomain.com',
            ports_exposes: '3000',
            autoDeploy: true,
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.application.uuid).toBe('app-live-created-99');
      expect(data.application.domains).toBe('https://app.yourdomain.com');
      expect(data.application.fqdn).toBe('https://app.yourdomain.com'); // Backwards-compatible
      expect(data.deployment).toBeDefined();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
