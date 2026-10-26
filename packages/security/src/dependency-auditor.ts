import { DependencyAuditResult, DependencyIssue } from './types.js';

export class DependencyAuditor {
  private static readonly KNOWN_VULNERABILITIES: Array<{
    package: string;
    affectedVersions: string[];
    severity: 'critical' | 'high' | 'moderate';
    advisory: string;
    fixedIn: string;
  }> = [
    {
      package: 'event-stream',
      affectedVersions: ['3.3.6'],
      severity: 'critical',
      advisory: 'CVE-2018-3721: Malicious code injection targeted at stealing cryptocurrency wallets',
      fixedIn: '4.0.1',
    },
    {
      package: 'flatmap-stream',
      affectedVersions: ['0.1.1', '0.1.0'],
      severity: 'critical',
      advisory: 'CVE-2018-1000858: Malicious package dependency injection',
      fixedIn: 'Removed',
    },
    {
      package: 'lodash',
      affectedVersions: ['4.17.15', '4.17.11', '4.17.10'],
      severity: 'high',
      advisory: 'CVE-2020-8203: Prototype Pollution in lodash',
      fixedIn: '4.17.21',
    },
    {
      package: 'minimist',
      affectedVersions: ['0.2.0', '1.2.0', '1.2.2'],
      severity: 'high',
      advisory: 'CVE-2020-7598: Prototype Pollution via parse function',
      fixedIn: '1.2.6',
    },
  ];

  /**
   * Audits a package.json content string or object for vulnerable dependencies.
   */
  public static auditPackageJson(packageJsonRaw: string | Record<string, any>): DependencyAuditResult {
    let pkg: Record<string, any>;
    try {
      pkg = typeof packageJsonRaw === 'string' ? JSON.parse(packageJsonRaw) : packageJsonRaw;
    } catch {
      return { clean: false, issues: [{ packageName: 'package.json', currentVersion: '', severity: 'critical', advisory: 'Invalid JSON syntax' }], scannedDependenciesCount: 0 };
    }

    const dependencies = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    const issues: DependencyIssue[] = [];
    const depNames = Object.keys(dependencies);

    for (const [depName, versionSpec] of Object.entries(dependencies)) {
      const cleanVer = (versionSpec as string).replace(/^[\^~>=<]/, '');
      const match = this.KNOWN_VULNERABILITIES.find(
        (v) => v.package === depName && v.affectedVersions.includes(cleanVer)
      );

      if (match) {
        issues.push({
          packageName: depName,
          currentVersion: versionSpec as string,
          severity: match.severity,
          advisory: match.advisory,
          fixedIn: match.fixedIn,
        });
      }
    }

    return {
      clean: issues.length === 0,
      issues,
      scannedDependenciesCount: depNames.length,
    };
  }
}
