import { describe, it, expect } from 'vitest';
import { getCookieDomain, createSessionToken } from '../apps/web/src/lib/auth-cookie';
import { activateUserSubscription, createUser, findUserByEmail, verifyUserCredentials } from '../apps/web/src/lib/user-store';

describe('Multi-Subdomain SSO Auth & Crypto Payments', () => {
  it('should resolve .ultrapie.com wildcard cookie domain for apex and subdomains', () => {
    expect(getCookieDomain('ultrapie.com')).toBe('.ultrapie.com');
    expect(getCookieDomain('studio.ultrapie.com')).toBe('.ultrapie.com');
    expect(getCookieDomain('hosting.ultrapie.com')).toBe('.ultrapie.com');
    expect(getCookieDomain('media.ultrapie.com')).toBe('.ultrapie.com');
    expect(getCookieDomain('app-123.ultrapie.com:443')).toBe('.ultrapie.com');
  });

  it('should not set root domain on localhost or IP addresses', () => {
    expect(getCookieDomain('localhost')).toBeUndefined();
    expect(getCookieDomain('localhost:3005')).toBeUndefined();
    expect(getCookieDomain('127.0.0.1')).toBeUndefined();
  });

  it('should encode valid session token that decodes into user id and email', () => {
    const token = createSessionToken({ id: 'usr_test_999', email: 'test@ultrapie.com' });
    expect(token).toMatch(/^session_[A-Za-z0-9+/=]+$/);

    const b64 = token.replace('session_', '');
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    const [userId, email] = decoded.split(':');

    expect(userId).toBe('usr_test_999');
    expect(email).toBe('test@ultrapie.com');
  });

  it('should register and authenticate a user with real salted password', () => {
    const testEmail = `user_${Date.now()}@testdomain.com`;
    const user = createUser('Crypto Builder', testEmail, 'StrongPass2026!');
    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.isSubscribed).toBe(false);

    // Verify valid credentials
    const authenticated = verifyUserCredentials(testEmail, 'StrongPass2026!');
    expect(authenticated).toBeDefined();
    expect(authenticated?.id).toBe(user.id);

    // Verify invalid credentials fail
    const failed = verifyUserCredentials(testEmail, 'WrongPassword!');
    expect(failed).toBeNull();
  });

  it('should activate subscription with Crypto payment and record TxHash', () => {
    const cryptoUserEmail = `crypto_${Date.now()}@web3.io`;
    createUser('Satoshi Nakamoto', cryptoUserEmail, 'BtcPass2026!');

    const txHash = '0x8f7c9e123456789abcdef0123456789abcdef0123456789abcdef0123456789a';
    const updated = activateUserSubscription(cryptoUserEmail, 'PRO', {
      paymentMethod: 'CRYPTO',
      cryptoCurrency: 'USDT-TRC20',
      cryptoTxHash: txHash,
    });

    expect(updated.isSubscribed).toBe(true);
    expect(updated.plan).toBe('PRO');
    expect(updated.paymentMethod).toBe('CRYPTO');
    expect(updated.cryptoCurrency).toBe('USDT-TRC20');
    expect(updated.cryptoTxHash).toBe(txHash);

    // Ensure persisted in store
    const retrieved = findUserByEmail(cryptoUserEmail);
    expect(retrieved?.paymentMethod).toBe('CRYPTO');
    expect(retrieved?.cryptoCurrency).toBe('USDT-TRC20');
  });
});
