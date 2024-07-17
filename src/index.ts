import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HonoEnv } from './util.js';
import legacyApp from './apps/_legacy.js';
import authApp from './apps/auth.js';
import v1BansApp from './apps/v1/bans.js';
import v1BadgesApp from './apps/v1/badges.js';
import v1ReleasesApp from './apps/v1/releases.js';
import { ZodError } from 'zod';

import { D1QB } from 'workers-qb';
import { Octokit } from 'octokit';
// import { apiReference } from '@scalar/hono-api-reference';
// import document from './docs/schema.js';

const app = new Hono<HonoEnv>();

app.use('/*', async (c, next) => {
	c.set('db', new D1QB(c.env.DB));
	c.set('octokit', new Octokit({ auth: c.env.GITHUB_PAT }));

	return await next();
});

app.use('/*', cors());

app.route('/', legacyApp);
app.route('/auth', authApp);
app.route('/v1/bans', v1BansApp);
app.route('/v1/badges', v1BadgesApp);
app.route('/v1/releases', v1ReleasesApp);

// TODO: Finish API docs
// app.get('/v1/docs', apiReference({ spec: { content: document } }));
// app.get("/docs", (c) => c.redirect("/v1/docs"))

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
