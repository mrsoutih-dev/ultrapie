import { DetectedSecret, SecretSeverity } from './types.js';

export class SecretLeakDetectedError extends Error {
  constructor(public readonly secrets: DetectedSecret[]) {
    const list = secrets.map((s) => `[${s.severity.toUpperCase()}] ${s.ruleName} in ${s.filename}:${s.line} (${s.maskedString})`).join('\n');
    super(`Secret leak prevented! Found ${secrets.length} secret(s) in code:\n${list}`);
    this.name = 'SecretLeakDetectedError';
  }
}

interface SecretRule {
  name: string;
  pattern: RegExp;
  severity: SecretSeverity;
}

export class SecretScanner {
  private static readonly RULES: SecretRule[] = [
    {
      name: 'GitHub Personal Access Token',
      pattern: /(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})/g,
      severity: 'critical',
    },
    {
      name: 'Google Gemini / Cloud API Key',
      pattern: /(AQ\.[a-zA-Z0-9_\-]{40,}|AIza[0-9A-Za-z\-_]{35})/g,
      severity: 'critical',
    },
    {
      name: 'AWS Access Key ID',
      pattern: /(AKIA[0-9A-Z]{16})/g,
      severity: 'critical',
    },
    {
      name: 'Stripe Secret Key',
      pattern: /(sk_live_[0-9a-zA-Z]{24,}|sk_test_[0-9a-zA-Z]{24,})/g,
      severity: 'critical',
    },
    {
      name: 'Private Cryptographic Key',
      pattern: /-----BEGIN (RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----/g,
      severity: 'critical',
    },
    {
      name: 'Unmasked Credential in .env',
      pattern: /(?:DATABASE_URL|JWT_SECRET|API_SECRET|SUPABASE_KEY|PRIVATE_KEY)\s*=\s*['"]?([^\s'"]{8,})/g,
      severity: 'high',
    },
  ];

  /**
   * Masks a sensitive string preserving first 3 and last 3 characters.
   */
  public static maskSecret(secret: string): string {
    if (secret.length <= 8) return '********';
    const prefix = secret.slice(0, 4);
    const suffix = secret.slice(-4);
    return `${prefix}....${suffix}`;
  }

  /**
   * Scans a single text content for secrets.
   */
  public static scanText(content: string, filename = 'workspace-file'): DetectedSecret[] {
    const detected: DetectedSecret[] = [];
    const lines = content.split(/\r?\n/);

    for (const rule of this.RULES) {
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        // Reset regex state
        rule.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = rule.pattern.exec(lineText)) !== null) {
          const matchedString = match[1] || match[0];
          detected.push({
            ruleName: rule.name,
            matchedString,
            maskedString: this.maskSecret(matchedString),
            severity: rule.severity,
            filename,
            line: i + 1,
          });
        }
      }
    }

    return detected;
  }

  /**
   * Scans an entire dictionary of workspace files.
   */
  public static scanWorkspace(files: Record<string, string>): DetectedSecret[] {
    const allDetected: DetectedSecret[] = [];

    for (const [filename, content] of Object.entries(files)) {
      const issues = this.scanText(content, filename);
      allDetected.push(...issues);
    }

    return allDetected;
  }

  /**
   * Throws SecretLeakDetectedError if any secrets are present.
   */
  public static assertNoSecrets(files: Record<string, string>): void {
    const leaks = this.scanWorkspace(files);
    if (leaks.length > 0) {
      throw new SecretLeakDetectedError(leaks);
    }
  }
}
