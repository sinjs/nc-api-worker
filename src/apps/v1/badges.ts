import { Hono } from 'hono';
import { Badge, HonoEnv } from '../../util.js';
import { Raw } from 'workers-qb';
import { admin, auth } from '../../middleware/auth.js';
import { z } from 'zod';
import { JSONValue } from 'hono/utils/types';

/**
 * Mounted at `/v1/badges`
 */
const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
	const response = await fetch(`https://api.nigga.church/v2/badges/${new URL(c.req.url).search}`);
	const json = await response.json();
	return c.json(json as object);
});

app.get('/:userId', async (c) => {
	const response = await fetch(`https://api.nigga.church/v2/badges/${c.req.param('userId')}${new URL(c.req.url).search}`);
	const json = await response.json();
	return c.json(json as object);
});

app.put('/', (c) =>
	c.json({ error: 'Gone', message: 'This version has been set to read-only mode. Please use the `/v2` endpoints instead.' }, 410),
);
app.delete('/:badgeId', (c) =>
	c.json({ error: 'Gone', message: 'This version has been set to read-only mode. Please use the `/v2` endpoints instead.' }, 410),
);

export default app;
