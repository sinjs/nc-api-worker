import { decode, JwtPayload, verify } from '@tsndr/cloudflare-worker-jwt';
import { createMiddleware } from 'hono/factory';
import { HonoEnv, Jwt, User } from '../util';

export type TokenVariable = JwtPayload<Jwt> & { raw: string };

export const auth = createMiddleware(async (c, next) => {
	const header = c.req.header('Authorization');

	if (!header || !header.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

	const token = header.substring('Bearer '.length);

	try {
		const verified = await verify(token, c.env.JWT_SECRET);
		if (!verified) return c.json({ error: 'Unauthorized' }, 401);

		const decoded = decode<Jwt>(token);

		if (!decoded.payload) throw new Error('Invalid token payload');

		c.set('token', { ...decoded.payload, raw: token });
	} catch (error) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	await next();
});

export const admin = createMiddleware<HonoEnv>(async (c, next) => {
	const token = c.get('token');

	if (!token) return c.json({ error: 'Unauthorized' }, 401);

	const user = await c.env.DB.prepare('SELECT * FROM user WHERE id = ?').bind(token.uid).first<User>();

	if (!user?.isAdmin) return c.json({ error: 'Forbidden' }, 403);
	await next();
});
