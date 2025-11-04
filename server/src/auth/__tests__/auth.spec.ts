import { describe, it, expect } from 'vitest';
import argon2 from 'argon2';
import { signAccessToken, signRefreshToken, verifyToken } from '../jwt';

describe('auth basics', () => {
  it('argon2 hash & verify', async () => {
    const pw = 'SuperSecret123!';
    const hash = await argon2.hash(pw);
    expect(await argon2.verify(hash, pw)).toBe(true);
    expect(await argon2.verify(hash, 'wrong')).toBe(false);
  });

  it('jwt sign & verify', () => {
    const access = signAccessToken({ sub: 'uid1', role: 'USER' });
    const payload: any = verifyToken(access);
    expect(payload.sub).toBe('uid1');
    expect(payload.role).toBe('USER');

    const { token: refresh, jti } = signRefreshToken({ sub: 'uid1', role: 'USER' });
    const p2: any = verifyToken(refresh);
    expect(p2.jti).toBeDefined();
    expect(p2.sub).toBe('uid1');
  });
});
