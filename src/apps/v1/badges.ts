import { Hono } from 'hono';
import { Badge, HonoEnv } from '../../util';
import { Raw } from 'workers-qb';
import { admin, auth } from '../../middleware/auth';
import { z } from 'zod';

/**
 * Mounted at `/v1/badges`
 */
const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
	const { results: badges } = await c.get('db').fetchAll<Badge>({ tableName: 'badge' }).execute();

	if (!badges) throw new Error('Badges are undefined');
	if (c.req.query('type') !== 'object') return c.json(badges);

	const object = badges.reduce((acc: Record<string, Omit<Badge, 'userId'>[]>, { userId, ...badge }) => {
		(acc[userId] = acc[userId] || []).push(badge);
		return acc;
	}, {});

	return c.json(object);
});

app.get('/:userId', async (c) => {
	const userId = c.req.param('userId');
	const { results: badges } = await c
		.get('db')
		.fetchAll<Badge>({ tableName: 'badge', where: { conditions: 'userId = ?', params: [userId] } })
		.execute();

	if (!badges) return c.json({ error: 'Not Found' }, 404);

	return c.json(badges);
});

app.put('/', auth, admin, async (c) => {
	const schema = z.object({
		userId: z.string(),
		badge: z.string().url(),
		tooltip: z.string(),
		badgeType: z.enum(['donor']).default('donor'),
	});

	const body = schema.parse(await c.req.json());

	await c
		.get('db')
		.insert<Badge>({
			tableName: 'badge',
			data: body,
		})
		.execute();

	return c.body(null, 204);
});

app.delete('/:badgeId', auth, admin, async (c) => {
	const badgeId = z.coerce.number().parse(c.req.param('badgeId'));
	await c.env.DB.prepare('DELETE FROM badge WHERE id = ?').bind(badgeId).run();

	return c.body(null, 204);
});

export default app;
