import { describe, it, expect } from 'vitest';
import {
  createDeployment,
  getDeploymentBySlug,
  updateDeployment,
  rollbackDeployment,
  deleteDeployment,
  getDeployments,
} from '../apps/web/src/lib/hosting/edge-deployments';

describe('Milestone H1 & H2: Edge Deployments & Hosting Engine', () => {
  it('should initialize with default pre-seeded demo applications', () => {
    const list = getDeployments();
    expect(list.length).toBeGreaterThanOrEqual(1);

    const counterApp = getDeploymentBySlug('counter-demo');
    expect(counterApp).toBeDefined();
    expect(counterApp?.subdomain).toBe('counter-demo.ultrapie.com');
    expect(counterApp?.status).toBe('ready');
    expect(counterApp?.sslStatus).toBe('active');
  });

  it('should create an edge deployment with version 1 and build logs', () => {
    const dep = createDeployment({
      name: 'Test Storefront App',
      files: {
        'src/App.tsx': 'export default function App() { return <div>Storefront</div>; }',
        'src/index.css': 'body { background: #000; }',
      },
      type: 'edge',
      framework: 'React 19 + Tailwind',
      envVars: {
        STORE_NAME: 'Ultrapie Store',
      },
    });

    expect(dep.id).toBeDefined();
    expect(dep.slug).toBe('test-storefront-app');
    expect(dep.subdomain).toBe('test-storefront-app.ultrapie.com');
    expect(dep.version).toBe(1);
    expect(dep.type).toBe('edge');
    expect(dep.files['src/App.tsx']).toContain('Storefront');
    expect(dep.logs.length).toBeGreaterThan(0);
    expect(dep.sslStatus).toBe('active');

    // Retrieve by slug
    const fetched = getDeploymentBySlug('test-storefront-app');
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('Test Storefront App');
  });

  it('should update a deployment with new version snapshot when deployed again', () => {
    const updated = createDeployment({
      name: 'Test Storefront App',
      files: {
        'src/App.tsx': 'export default function App() { return <div>Storefront v2</div>; }',
      },
      type: 'edge',
    });

    expect(updated.version).toBe(2);
    expect(updated.history.length).toBeGreaterThanOrEqual(1);
    expect(updated.files['src/App.tsx']).toContain('Storefront v2');
  });

  it('should support instant 1-click rollback to prior version', () => {
    const dep = getDeploymentBySlug('test-storefront-app');
    expect(dep).toBeDefined();
    if (!dep) return;

    const rolledBack = rollbackDeployment(dep.id, 1);
    expect(rolledBack).toBeDefined();
    expect(rolledBack?.files['src/App.tsx']).toContain('Storefront');
    expect(rolledBack?.logs[0].message).toContain('Instant rollback triggered');
  });

  it('should attach a custom domain and update SSL status', () => {
    const dep = getDeploymentBySlug('test-storefront-app');
    expect(dep).toBeDefined();
    if (!dep) return;

    const updated = updateDeployment(dep.id, {
      customDomain: 'store.ultrapie.com',
      sslStatus: 'active',
    });

    expect(updated?.customDomain).toBe('store.ultrapie.com');
    expect(updated?.sslStatus).toBe('active');
  });

  it('should update environment variables', () => {
    const dep = getDeploymentBySlug('test-storefront-app');
    expect(dep).toBeDefined();
    if (!dep) return;

    const updated = updateDeployment(dep.id, {
      envVars: {
        STORE_NAME: 'Updated Store',
        API_KEY: 'secret_123',
      },
    });

    expect(updated?.envVars.STORE_NAME).toBe('Updated Store');
    expect(updated?.envVars.API_KEY).toBe('secret_123');
  });

  it('should delete a deployment cleanly', () => {
    const dep = getDeploymentBySlug('test-storefront-app');
    expect(dep).toBeDefined();
    if (!dep) return;

    const deleted = deleteDeployment(dep.id);
    expect(deleted).toBe(true);

    const check = getDeploymentBySlug('test-storefront-app');
    expect(check).toBeUndefined();
  });
});
