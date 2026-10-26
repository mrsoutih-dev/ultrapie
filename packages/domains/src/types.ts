export type DomainVerificationStatus = 'pending' | 'verified' | 'failed';
export type SslStatus = 'initializing' | 'active' | 'failed';

export interface DnsVerificationRecord {
  type: 'CNAME' | 'TXT';
  name: string;
  value: string;
}

export interface DomainRecord {
  id: string;
  projectId: string;
  organizationId: string;
  hostname: string;
  isCustom: boolean;
  verificationStatus: DomainVerificationStatus;
  sslStatus: SslStatus;
  dnsRecords: DnsVerificationRecord[];
  createdAt: string;
  verifiedAt?: string;
}

export interface EdgeRouteMatch {
  matched: boolean;
  hostname: string;
  projectId: string;
  activeReleaseStorageKey?: string;
  sslActive: boolean;
}
