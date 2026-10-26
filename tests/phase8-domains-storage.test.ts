import { describe, it, expect } from 'vitest';
import { StorageService, UnauthorizedStorageAccessError } from '@ultrapie/storage';
import { DomainService, DomainConflictError } from '@ultrapie/domains';

describe('Phase 08: Cloudflare CDN, R2 Storage & Custom Domains', () => {
  describe('Tiered Object Storage & Presigned Token Access', () => {
    const storage = new StorageService({
      signingSecret: 'test-r2-signing-key-12345678',
      cdnBaseUrl: 'https://assets.ultrapie.com',
    });

    it('should store and retrieve public assets with CDN url', async () => {
      await storage.putObject('public-assets', 'images/logo.png', 'PNG_IMAGE_DATA', 'image/png');
      const obj = await storage.getObject('public-assets', 'images/logo.png');

      expect(obj.contentType).toBe('image/png');
      expect(storage.getPublicDeliveryUrl('public-assets', 'images/logo.png')).toBe(
        'https://assets.ultrapie.com/public-assets/images/logo.png'
      );
    });

    it('should strictly deny unauthenticated access to private source archives', async () => {
      await storage.putObject(
        'private-sources',
        'sources/proj_1/archive.zip',
        'ZIP_SOURCE_CODE',
        'application/zip'
      );

      // Attempt reading private file without signed token -> strictly blocked
      await expect(storage.getObject('private-sources', 'sources/proj_1/archive.zip')).rejects.toThrow(
        UnauthorizedStorageAccessError
      );
    });

    it('should allow access to private sources using valid signed token', async () => {
      const presigned = storage.generatePresignedUrl(
        'private-sources',
        'sources/proj_1/archive.zip',
        300
      );
      const url = new URL(presigned.url);
      const token = url.searchParams.get('token');

      expect(token).toBeDefined();

      const obj = await storage.getObject('private-sources', 'sources/proj_1/archive.zip', token!);
      expect(obj.data).toBe('ZIP_SOURCE_CODE');
    });

    it('should reject tampered or expired presigned tokens', async () => {
      const presigned = storage.generatePresignedUrl(
        'private-sources',
        'sources/proj_1/archive.zip',
        -10 // Expired 10s ago
      );
      const url = new URL(presigned.url);
      const expiredToken = url.searchParams.get('token');

      await expect(
        storage.getObject('private-sources', 'sources/proj_1/archive.zip', expiredToken!)
      ).rejects.toThrow(UnauthorizedStorageAccessError);
    });
  });

  describe('Subdomains, Custom Domains & SSL Management', () => {
    const domainService = new DomainService();
    const orgA = 'org_alpha';
    const orgB = 'org_beta';
    const projA = 'proj_01';

    it('should create and verify automatic platform subdomains', () => {
      const sub = domainService.createPlatformSubdomain(projA, orgA, 'landing-vibe');

      expect(sub.hostname).toBe('landing-vibe.ultrapie.com');
      expect(sub.verificationStatus).toBe('verified');
      expect(sub.sslStatus).toBe('active');
    });

    it('should register custom domain with DNS challenge records', () => {
      const custom = domainService.registerCustomDomain(projA, orgA, 'app.mybrand.com');

      expect(custom.hostname).toBe('app.mybrand.com');
      expect(custom.verificationStatus).toBe('pending');
      expect(custom.dnsRecords).toHaveLength(2);

      const cname = custom.dnsRecords.find((r) => r.type === 'CNAME');
      const txt = custom.dnsRecords.find((r) => r.type === 'TXT');

      expect(cname?.value).toBe('ingress.ultrapie.com');
      expect(txt?.name).toContain('_ultrapie-challenge');
    });

    it('should verify custom domain and issue SSL upon DNS challenge resolution', () => {
      const custom = domainService.registerCustomDomain(projA, orgA, 'shop.acme.com');
      const txtRecord = custom.dnsRecords.find((r) => r.type === 'TXT')!;

      // Simulated DNS resolver that returns matching TXT record
      const mockResolver = (name: string, type: string) => {
        if (name === txtRecord.name && type === 'TXT') return txtRecord.value;
        return null;
      };

      const verified = domainService.verifyCustomDomain(custom.id, mockResolver);
      expect(verified.verificationStatus).toBe('verified');
      expect(verified.sslStatus).toBe('active');
    });

    it('should prevent domain takeover attacks across different organizations', () => {
      // Org A already registered app.taken.com
      domainService.registerCustomDomain(projA, orgA, 'app.taken.com');

      // Org B attempts to hijack app.taken.com -> strictly blocked!
      expect(() => {
        domainService.registerCustomDomain('proj_02', orgB, 'app.taken.com');
      }).toThrow(DomainConflictError);
    });

    it('should route incoming edge hostname to target project and active release', () => {
      const custom = domainService.registerCustomDomain(projA, orgA, 'portal.client.com');
      domainService.verifyCustomDomain(custom.id);

      const activeReleases = new Map<string, string>();
      activeReleases.set(projA, 'releases/proj_01/release-sha-v1');

      const route = domainService.resolveEdgeRoute('portal.client.com', activeReleases);
      expect(route.matched).toBe(true);
      expect(route.projectId).toBe(projA);
      expect(route.activeReleaseStorageKey).toBe('releases/proj_01/release-sha-v1');
      expect(route.sslActive).toBe(true);
    });
  });
});
