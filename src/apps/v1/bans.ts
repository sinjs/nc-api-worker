import { Hono } from 'hono';
import { Ban, HonoEnv } from '../../util';
import { admin, auth } from '../../middleware/auth';
import { z } from 'zod';

/**
 * Mounted at `/v1/bans`
 */
const app = new Hono<HonoEnv>();

app.get('/', auth, admin, async (c) => {
	const { results: bans } = await c.env.DB.prepare('SELECT * FROM ban').all<Ban>();
	return c.json({ bans });
});

app.get('/:userId', async (c) => {
	const userId = c.req.param('userId');
	const ban = await c.env.DB.prepare('SELECT * FROM ban WHERE userId = ?').bind(userId).first<Ban>();

	if (!ban) return c.json({ banned: false });
	return c.json({ banned: true, ban });
});

app.put('/', auth, admin, async (c) => {
	const schema = z.object({
		userId: z.string(),
		reason: z
			.string()
			.optional()
			.transform((a) => a ?? null),
		expires: z.coerce
			.date()
			.optional()
			.transform((a) => a ?? null),
	});

	const body = schema.parse(await c.req.json());

	await c.env.DB.prepare('INSERT INTO ban (userId, reason, expires) VALUES (?1, ?2, ?3)')
		.bind(body.userId, body.reason, body.expires)
		.run();

	return c.body(null, 201);
});

app.delete('/:userId', auth, admin, async (c) => {
	const userId = c.req.param('userId');
	await c.env.DB.prepare('DELETE FROM ban WHERE userId = ?').bind(userId).run();

	return c.body(null, 204);
});

export default app;
