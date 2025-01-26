import { Hono } from 'hono';
import { Ban, HonoEnv } from '../../util.js';
import { admin, auth } from '../../middleware/auth.js';
import { z } from 'zod';

/**
 * Mounted at `/v1/bans`
 */
const app = new Hono<HonoEnv>();

app.get('/', auth, admin, async (c) => {
	return c.json({ error: 'Gone', message: 'This version has been set to read-only mode. Please use the `/v2` endpoints instead.' }, 410);
});

app.get('/:userId', async (c) => {
	const userId = c.req.param('userId');

	const ban = await fetch(`https://api.nigga.church/v2/bans/${userId}`).then((response) => response.json());

	if (!ban) return c.json({ banned: false });
	return c.json({ banned: true, ban });
});

app.put('/', (c) =>
	c.json({ error: 'Gone', message: 'This version has been set to read-only mode. Please use the `/v2` endpoints instead.' }, 410),
);
app.delete('/:userId', (c) =>
	c.json({ error: 'Gone', message: 'This version has been set to read-only mode. Please use the `/v2` endpoints instead.' }, 410),
);

export default app;
