import * as crypto from 'crypto';
import {
  DomainRecord,
  DnsVerificationRecord,
  EdgeRouteMatch,
  DomainVerificationStatus,
} from './types.js';

export class DomainConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainConflictError';
  }
}

export class DomainService {
  private domains: Map<string, DomainRecord> = new Map();
  private hostnameIndex: Map<string, string> = new Map();

  /**
   * Generates default verified platform subdomain (e.g., project-slug.ultrapie.com).
   */
  createPlatformSubdomain(projectId: string, organizationId: string, projectSlug: string): DomainRecord {
    const hostname = `${projectSlug.toLowerCase()}.ultrapie.com`;

    if (this.hostnameIndex.has(hostname)) {
      throw new DomainConflictError(`Subdomain '${hostname}' is already allocated`);
    }

    const domainId = `dom_${crypto.randomBytes(6).toString('hex')}`;
    const record: DomainRecord = {
      id: domainId,
      projectId,
      organizationId,
      hostname,
      isCustom: false,
      verificationStatus: 'verified',
      sslStatus: 'active',
      dnsRecords: [],
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    };

    this.domains.set(domainId, record);
    this.hostnameIndex.set(hostname, domainId);
    return record;
  }

  /**
   * Registers a customer's custom domain and returns required DNS verification records.
   * Enforces domain conflict/takeover prevention.
   */
  registerCustomDomain(projectId: string, organizationId: string, rawHostname: string): DomainRecord {
    const hostname = rawHostname.toLowerCase().trim();

    if (this.hostnameIndex.has(hostname)) {
      const existingId = this.hostnameIndex.get(hostname)!;
      const existing = this.domains.get(existingId);
      if (existing && existing.organizationId !== organizationId) {
        throw new DomainConflictError(
          `Domain takeover blocked: Hostname '${hostname}' is already registered by another organization.`
        );
      }
    }

    const verificationToken = crypto.randomBytes(16).toString('hex');
    const dnsRecords: DnsVerificationRecord[] = [
      {
        type: 'CNAME',
        name: hostname,
        value: 'ingress.ultrapie.com',
      },
      {
        type: 'TXT',
        name: `_ultrapie-challenge.${hostname}`,
        value: `ultrapie-verify=${verificationToken}`,
      },
    ];

    const domainId = `dom_${crypto.randomBytes(6).toString('hex')}`;
    const record: DomainRecord = {
      id: domainId,
      projectId,
      organizationId,
      hostname,
      isCustom: true,
      verificationStatus: 'pending',
      sslStatus: 'initializing',
      dnsRecords,
      createdAt: new Date().toISOString(),
    };

    this.domains.set(domainId, record);
    this.hostnameIndex.set(hostname, domainId);
    return record;
  }

  /**
   * Verifies DNS records for a registered custom domain and activates TLS certificate.
   */
  verifyCustomDomain(
    domainId: string,
    simulatedDnsLookup?: (name: string, type: string) => string | null
  ): DomainRecord {
    const domain = this.domains.get(domainId);
    if (!domain) {
      throw new Error(`Domain ${domainId} not found`);
    }

    if (!domain.isCustom) {
      return domain;
    }

    // If resolver provided, verify TXT challenge
    if (simulatedDnsLookup) {
      const txtRecord = domain.dnsRecords.find((r) => r.type === 'TXT');
      if (txtRecord) {
        const foundValue = simulatedDnsLookup(txtRecord.name, 'TXT');
        if (foundValue !== txtRecord.value) {
          domain.verificationStatus = 'failed';
          domain.sslStatus = 'failed';
          return domain;
        }
      }
    }

    domain.verificationStatus = 'verified';
    domain.sslStatus = 'active';
    domain.verifiedAt = new Date().toISOString();

    return domain;
  }

  /**
   * Resolves incoming edge HTTP requests to the target project and active release storage key.
   */
  resolveEdgeRoute(
    hostname: string,
    activeReleasesByProject: Map<string, string>
  ): EdgeRouteMatch {
    const cleanHost = hostname.toLowerCase().trim();
    const domainId = this.hostnameIndex.get(cleanHost);

    if (!domainId) {
      return { matched: false, hostname: cleanHost, projectId: '', sslActive: false };
    }

    const domain = this.domains.get(domainId);
    if (!domain || domain.verificationStatus !== 'verified') {
      return { matched: false, hostname: cleanHost, projectId: '', sslActive: false };
    }

    const activeReleaseKey = activeReleasesByProject.get(domain.projectId);

    return {
      matched: true,
      hostname: cleanHost,
      projectId: domain.projectId,
      activeReleaseStorageKey: activeReleaseKey,
      sslActive: domain.sslStatus === 'active',
    };
  }
}
