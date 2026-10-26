export type SecretSeverity = 'critical' | 'high' | 'medium';

export interface DetectedSecret {
  ruleName: string;
  matchedString: string;
  maskedString: string;
  severity: SecretSeverity;
  filename: string;
  line: number;
}

export interface QuarantineResult {
  status: 'clean' | 'quarantined';
  filename: string;
  fileSize: number;
  quarantineKey: string;
  cdnUrl?: string;
  detectedThreat?: string;
  scannedAt: string;
  scanEngine: string;
}

export interface DependencyIssue {
  packageName: string;
  currentVersion: string;
  severity: 'critical' | 'high' | 'moderate';
  advisory: string;
  fixedIn?: string;
}

export interface DependencyAuditResult {
  clean: boolean;
  issues: DependencyIssue[];
  scannedDependenciesCount: number;
}
