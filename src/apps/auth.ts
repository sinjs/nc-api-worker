import { Hono } from 'hono';
import { DISCORD_API_ENDPOINT, type HonoEnv, type Jwt, type User } from '../util';
import type { APIUser } from 'discord-api-types/v10';
import { sign } from '@tsndr/cloudflare-worker-jwt';

/**
 * Mounted at `/auth`
 */
const app = new Hono<HonoEnv>();

app.get('/url', (c) => {
	const url = new URL(`${DISCORD_API_ENDPOINT}/oauth2/authorize`);

	url.searchParams.set('client_id', c.env.DISCORD_CLIENT_ID);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('redirect_uri', c.env.DISCORD_REDIRECT_URI);
	url.searchParams.set('scope', 'identify email guilds.join');

	return c.json({ url });
});

app.get('/callback', async (c) => {
	const code = c.req.query('code');

	if (!code) return c.json({ error: 'Bad Request', message: 'Invalid code parameter' }, 400);

	const response: { access_token: string; expires_in: number } = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: c.env.DISCORD_CLIENT_ID,
			client_secret: c.env.DISCORD_CLIENT_SECRET,
			grant_type: 'authorization_code',
			code,
			redirect_uri: c.env.DISCORD_REDIRECT_URI,
		}),
	}).then((response) => response.json());

	console.log(response);

	const { access_token, expires_in } = response;

	console.log(access_token, expires_in);

	const discordUser: APIUser = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	}).then((response) => {
		if (!response.ok) throw new Error(`Response failed with status code ${response.status}`);
		return response.json();
	});

	let user = await c.env.DB.prepare('SELECT * FROM user WHERE discordUserId = ?').bind(discordUser.id).first<User>();

	if (!user) {
		await c.env.DB.prepare('INSERT INTO user (discordUserId) VALUES (?)').bind(discordUser.id).run();
		user = await c.env.DB.prepare('SELECT * FROM user WHERE discordUserId = ?').bind(discordUser.id).first<User>();
	}

	const token = await sign(
		{
			discord_access_token: access_token,
			discord_user_id: discordUser.id,
			exp: Date.now() / 1000 + expires_in,
			iat: Date.now() / 1000,
			admin: !!user!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!.isAdmin,
			name: discordUser.username,
			uid: user!.id,
		} satisfies Jwt,
		c.env.JWT_SECRET
	);

	return c.json({ token });
});

export default app;
