import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HonoEnv } from './util';
import legacyApp from './apps/_legacy';
import authApp from './apps/auth';
import v1BansApp from './apps/v1/bans';
import v1BadgesApp from './apps/v1/badges';
import { ZodError } from 'zod';

import { D1QB } from 'workers-qb';
const app = new Hono<HonoEnv>();

app.use('/*', (c, next) => {
	c.set('db', new D1QB(c.env.DB));
	return next();
});

app.use('/*', cors());

app.route('/', legacyApp);
app.route('/auth', authApp);
app.route('/v1/bans', v1BansApp);
app.route('/v1/badges', v1BadgesApp);

app.onError((err, c) => {
	if (err instanceof ZodError) {
		return c.json({ error: 'Bad Request', issues: err.flatten() }, 400);
	}

	const uuid = crypto.randomUUID();
	console.error(`Error: Failed to process request ${uuid}\n`, err);
	return c.json({ error: 'Internal Server Error' }, 500);
});

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

export default app;
