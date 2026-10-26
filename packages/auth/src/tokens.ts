import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { AuthSession } from './types.js';

const DEFAULT_SECRET = 'ultrapie-dev-insecure-secret-key-change-in-prod';

function getSecretKey(secret?: string): Uint8Array {
  const secretString = secret || process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secretString);
}

export async function signSessionToken(
  session: AuthSession,
  secret?: string,
  expiresIn = '7d'
): Promise<string> {
  const key = getSecretKey(secret);

  return new SignJWT({
    userId: session.userId,
    email: session.email,
    name: session.name,
    currentOrgId: session.currentOrgId,
    role: session.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer('ultrapie:auth')
    .setAudience('ultrapie:api')
    .sign(key);
}

export async function verifySessionToken(
  token: string,
  secret?: string
): Promise<AuthSession | null> {
  try {
    const key = getSecretKey(secret);
    const { payload } = await jwtVerify(token, key, {
      issuer: 'ultrapie:auth',
      audience: 'ultrapie:api',
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
      currentOrgId: payload.currentOrgId as string,
      role: payload.role as any,
    };
  } catch (error) {
    return null;
  }
}
