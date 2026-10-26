import * as crypto from 'crypto';

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

export class WebhookVerifier {
  /**
   * Verifies the GitHub X-Hub-Signature-256 header using timing-safe comparison.
   */
  static verifySignature(rawBody: string, signatureHeader: string | undefined, secret: string): boolean {
    if (!signatureHeader || !secret) {
      return false;
    }

    const trimmedSignature = signatureHeader.trim();
    if (!trimmedSignature.startsWith('sha256=')) {
      return false;
    }

    const expectedHash = trimmedSignature.substring(7);
    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf-8')
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (expectedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, computedBuffer);
  }
}

export class WebhookIdempotencyManager {
  private processedDeliveries: Set<string> = new Set();

  /**
   * Checks if an event delivery ID has already been processed.
   * If not, records it and returns true (safe to execute).
   */
  recordEventIfNew(deliveryId: string): boolean {
    if (!deliveryId) {
      throw new WebhookVerificationError('Missing X-GitHub-Delivery ID');
    }

    if (this.processedDeliveries.has(deliveryId)) {
      return false; // Duplicate replay event
    }

    this.processedDeliveries.add(deliveryId);
    return true;
  }

  isProcessed(deliveryId: string): boolean {
    return this.processedDeliveries.has(deliveryId);
  }

  clear(): void {
    this.processedDeliveries.clear();
  }
}
