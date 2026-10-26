import { describe, it, expect } from 'vitest';
import { StorageService } from '@ultrapie/storage';
import {
  SecretScanner,
  SecretLeakDetectedError,
  QuarantinePipeline,
  DependencyAuditor,
} from '@ultrapie/security';

describe('Phase 09: Defense-in-Depth Security & File Quarantine', () => {
  describe('Secret Leak Scanner (TruffleHog Pattern Engine)', () => {
    it('should detect exposed GitHub Personal Access Tokens (PATs)', () => {
      const mockPat = ['ghp', '1234567890abcdef1234567890abcdef1234'].join('_');
      const code = `
        const token = "${mockPat}";
        fetch("https://api.github.com/user", { headers: { Authorization: token } });
      `;
      const findings = SecretScanner.scanText(code, 'src/api.ts');
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleName).toBe('GitHub Personal Access Token');
      expect(findings[0].severity).toBe('critical');
      expect(findings[0].maskedString).toBe('ghp_....1234');
    });

    it('should detect exposed Google Gemini / Cloud API keys', () => {
      const mockApiKey = ['AQ', 'DummyGoogleTestApiKeyForSecurityScannerTestingOnly1234'].join('.');
      const code = `
        const apiKey = "${mockApiKey}";
        const client = new GoogleGenAI({ apiKey });
      `;
      const findings = SecretScanner.scanText(code, 'src/ai.ts');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings[0].ruleName).toBe('Google Gemini / Cloud API Key');
      expect(findings[0].severity).toBe('critical');
    });

    it('should detect AWS Access Keys and Private Cryptographic Keys', () => {
      const mockAwsKey = ['AKIA', 'IOSFODNN7EXAMPLE'].join('');
      const files = {
        'src/aws.ts': `const accessKey = "${mockAwsKey}";`,
        'keys/id_rsa': `-----BEGIN RSA KEY-----\nMIIEowIBAAKCAQEAz7...==\n-----END RSA KEY-----`,
      };

      const findings = SecretScanner.scanWorkspace(files);
      expect(findings.length).toBeGreaterThanOrEqual(2);
      expect(findings.some((f) => f.ruleName === 'AWS Access Key ID')).toBe(true);
      expect(findings.some((f) => f.ruleName === 'Private Cryptographic Key')).toBe(true);
    });

    it('should throw SecretLeakDetectedError when asserting clean workspace with secrets', () => {
      const mockStripeKey = ['sk', 'test', '51AbCdEfGhIjKlMnOpQrStUvWxYz00000000'].join('_');
      const dirtyFiles = {
        'src/payment.ts': `const stripeKey = "${mockStripeKey}";`,
      };

      expect(() => SecretScanner.assertNoSecrets(dirtyFiles)).toThrow(SecretLeakDetectedError);
    });

    it('should allow completely clean production code to pass without findings', () => {
      const cleanFiles = {
        'src/App.tsx': 'export default function App() { return <h1>Clean App</h1>; }',
        'src/index.css': 'body { margin: 0; }',
      };

      const findings = SecretScanner.scanWorkspace(cleanFiles);
      expect(findings).toHaveLength(0);
      expect(() => SecretScanner.assertNoSecrets(cleanFiles)).not.toThrow();
    });
  });

  describe('File Upload Quarantine Pipeline (ClamAV & Threat Engine)', () => {
    it('should quarantine malicious EICAR test virus and block promotion to public assets (Acceptance #12)', async () => {
      const storage = new StorageService();
      const pipeline = new QuarantinePipeline(storage);

      // Standard EICAR Antivirus Test Signature
      const eicarPayload = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

      const result = await pipeline.processUpload(
        'suspicious_upload.txt',
        eicarPayload,
        'text/plain',
        'tenant_demo_1'
      );

      // Verify asset remains strictly quarantined
      expect(result.status).toBe('quarantined');
      expect(result.detectedThreat).toContain('EICAR');
      expect(result.cdnUrl).toBeUndefined();

      // Verify object exists in quarantine bucket
      const quarantinedObj = await storage.getObject(
        'quarantine',
        result.quarantineKey,
        storage.generatePresignedUrl('quarantine', result.quarantineKey).url.split('token=')[1]
      );
      expect(quarantinedObj).toBeDefined();

      // Verify object was NOT promoted to public-assets
      await expect(
        storage.getObject('public-assets', result.quarantineKey)
      ).rejects.toThrow();
    });

    it('should scan clean asset, promote to public-assets bucket, and deliver via Edge CDN (Acceptance #12)', async () => {
      const storage = new StorageService();
      const pipeline = new QuarantinePipeline(storage);

      const cleanImageBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>', 'utf-8');

      const result = await pipeline.processUpload(
        'logo.svg',
        cleanImageBuffer,
        'image/svg+xml',
        'tenant_demo_1'
      );

      // Verify asset passes scan cleanly and receives CDN URL
      expect(result.status).toBe('clean');
      expect(result.cdnUrl).toBeDefined();
      expect(result.cdnUrl).toContain('https://assets.ultrapie.com/public-assets/');

      // Verify asset can be retrieved from public-assets bucket
      const promotedKey = `tenant_demo_1/assets/${result.quarantineKey.split('/')[2]}`;
      const cleanObj = await storage.getObject('public-assets', promotedKey);
      expect(cleanObj).toBeDefined();
      expect(cleanObj.contentType).toBe('image/svg+xml');
    });

    it('should detect disguised binary executables (PE/ELF header injection)', async () => {
      const storage = new StorageService();
      const pipeline = new QuarantinePipeline(storage);

      // Fake SVG with DOS/PE header bytes (MZ)
      const peInjectedSvg = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

      const result = await pipeline.processUpload('innocent.svg', peInjectedSvg, 'image/svg+xml');
      expect(result.status).toBe('quarantined');
      expect(result.detectedThreat).toContain('Suspicious.PEHeaderInjection');
    });
  });

  describe('Dependency Vulnerability Auditor', () => {
    it('should flag known malicious or vulnerable npm dependencies in package.json', () => {
      const maliciousPackageJson = JSON.stringify({
        name: 'test-app',
        dependencies: {
          'event-stream': '3.3.6',
          'react': '^19.0.0',
        },
      });

      const audit = DependencyAuditor.auditPackageJson(maliciousPackageJson);
      expect(audit.clean).toBe(false);
      expect(audit.issues).toHaveLength(1);
      expect(audit.issues[0].packageName).toBe('event-stream');
      expect(audit.issues[0].severity).toBe('critical');
      expect(audit.issues[0].advisory).toContain('CVE-2018-3721');
    });

    it('should approve package.json with safe dependencies', () => {
      const safePackageJson = JSON.stringify({
        name: 'safe-app',
        dependencies: {
          'react': '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^1.0.0',
        },
      });

      const audit = DependencyAuditor.auditPackageJson(safePackageJson);
      expect(audit.clean).toBe(true);
      expect(audit.issues).toHaveLength(0);
      expect(audit.scannedDependenciesCount).toBe(3);
    });
  });
});
