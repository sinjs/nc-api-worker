import { Hono } from 'hono';
import type { HonoEnv } from '../util.js';

/**
 * Mouted at `/`
 */
const app = new Hono<HonoEnv>();

app.get('/sencord/bans', (c) => {
	const userId = c.req.query('user_id');

	if (!userId) return c.json({ error: 'Bad Request' }, 400);

	c.header('Deprecation', 'true');
	c.header('Link', `</v1/bans/${userId}>; rel="alternate"`);

	return c.redirect(`/v1/bans/${userId}`);
});

export default app;
