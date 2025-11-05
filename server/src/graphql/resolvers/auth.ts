/**
 * auth.ts — GraphQL resolvers for signup/login/logout/refresh
 *
 * These resolvers assume `users` collection exists.
 * They perform:
 * - signup: hash password -> insert user -> return access token + set refresh cookie
 * - login: verify password -> return access token + set refresh cookie
 * - refreshToken: read httpOnly cookie -> verify -> issue new access token (and optionally rotate refresh token)
 * - logout: remove refresh token record and clear cookie
 */

import type { Resolvers } from '../../generated/graphql';
import { Role } from '../../generated/graphql';
import { signupSchema, loginSchema } from '../../auth/validators';
import argon2 from 'argon2';
import { signAccessToken, signRefreshToken, verifyToken } from '../../auth/jwt';
import { saveRefreshToken, revokeRefreshToken, isRefreshTokenValid } from '../../auth/refreshStore';
import { getDb } from '../../db/client';
import { env } from '../../config/env';

const REFRESH_COOKIE_NAME = env.REFRESH_TOKEN_COOKIE_NAME;

/**
 * Helper to set httpOnly cookie on the Express response
 */
function setRefreshCookie(res: any, token: string, maxAgeMs: number) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: maxAgeMs,
    path: '/',
  });
}

export const authResolvers: Resolvers = {
  Mutation: {
    async createUser(_, { input }, { res }) {
      try {
        const parse = signupSchema.safeParse(input);
        if (!parse.success) {
          // include the validation issues for debugging (remove later)
          console.error('Signup validation failed:', parse.error.format());
          throw new Error('Invalid input');
        }

        const { name, email, password } = parse.data;
        const db = getDb();

        // ensure unique email at DB-level too (index)
        const existing = await db.collection('users').findOne({ email });
        if (existing) {
          console.error('Signup failed: email already exists', email);
          throw new Error('Email already in use');
        }

        const passwordHash = await argon2.hash(password);

        const now = new Date().toISOString();
        const result = await db.collection('users').insertOne({
          name,
          email,
          passwordHash,
          role: Role.User,
          createdAt: now,
          updatedAt: now,
        });

        if (!result.insertedId) {
          console.error('Insert returned no insertedId:', result);
          throw new Error('Failed to create user');
        }

        const userId = result.insertedId.toHexString();
        // sign tokens
        const access = signAccessToken({ sub: userId, role: Role.User });
        const { token: refreshToken, jti } = signRefreshToken({ sub: userId, role: Role.User });

        // persist refresh token jti with expiry date (approx from env)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // use env parsing for prod
        await saveRefreshToken(jti, userId, expiresAt);

        // set cookie
        setRefreshCookie(res, refreshToken, 7 * 24 * 60 * 60 * 1000);

        // Return the created user (without hash) + access token if you want
        return {
          id: userId,
          name,
          email,
          role: Role.User,
          createdAt: now,
          updatedAt: now,
        };
      } catch (error) {
        console.error('Signup failed:', error);
        throw new Error('Failed to create user');
      }
    },

    async login(_, { input }, { req, res }) {
      const parse = loginSchema.safeParse(input);
      if (!parse.success) throw new Error('Invalid input');

      const { email, password } = parse.data;
      const db = getDb();
      const user = await db.collection('users').findOne({ email });
      if (!user) throw new Error('Invalid credentials');

      const valid = await argon2.verify(user.passwordHash, password);
      if (!valid) throw new Error('Invalid credentials');

      const userId = user._id.toHexString();
      const role = user.role ?? Role.User;

      const access = signAccessToken({ sub: userId, role });
      const { token: refreshToken, jti } = signRefreshToken({ sub: userId, role });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await saveRefreshToken(jti, userId, expiresAt);

      setRefreshCookie(res, refreshToken, 7 * 24 * 60 * 60 * 1000);

      // return (optionally) user or token info depending on your API design
      return {
        id: userId,
        name: user.name,
        email: user.email,
        role,
        accessToken: access,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },

    async logout(_, __, { req, res }) {
      // read refresh cookie
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      if (token) {
        try {
          const payload: any = verifyToken(token);
          if (payload?.jti && payload?.sub) {
            await revokeRefreshToken(payload.jti);
          }
        } catch (e) {
          // ignore invalid token
        }
      }
      // clear cookie
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      return true;
    },

    async refreshToken(_, __, { req, res }) {
      // read refresh cookie
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      if (!token) throw new Error('No refresh token');

      let payload: any;
      try {
        payload = verifyToken(token);
      } catch (e) {
        throw new Error('Invalid refresh token');
      }

      const jti = payload.jti;
      const userId = payload.sub;
      if (!(await isRefreshTokenValid(jti, userId))) {
        throw new Error('Refresh token revoked');
      }

      // issue new access token (we keep refresh token as-is in this minimal example)
      const access = signAccessToken({ sub: userId, role: payload.role ?? Role.User });

      return { accessToken: access };
    },
  },
};
