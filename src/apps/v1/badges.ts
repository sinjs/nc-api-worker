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
	return c.json(badges);
});

app.get('/:userId', async (c) => {
	const userId = c.req.param('userId');
	const { results: badge } = await c
		.get('db')
		.fetchOne<Badge>({ tableName: 'badge', where: { conditions: 'discordUserId = ?', params: [userId] } })
		.execute();

	if (!badge) return c.json({ error: 'Not Found' }, 404);

	return c.json(badge);
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
			onConflict: {
				column: 'userId',
				data: {
					badge: new Raw('excluded.badge'),
					tooltip: new Raw('excluded.tooltip'),
					badgeType: new Raw('excluded.badgeType'),
				},
			},
		})
		.execute();

	return c.body(null, 204);
});

app.delete('/:userId', auth, admin, async (c) => {
	const userId = c.req.param('userId');
	await c.env.DB.prepare('DELETE FROM badge WHERE userId = ?').bind(userId).run();

	return c.body(null, 204);
});

export default app;
