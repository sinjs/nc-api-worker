import { res } from './util';

export interface Env {
	DB: D1Database;
}

interface Ban {
	id: string;
	reason: string;
	expires: string | false;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		switch (request.method) {
			case 'GET':
				switch (url.pathname) {
					case '/':
						return res({ message: 'nothing to see here :3' }, 200);
					case '/sencord/bans':
						return await this.banHandler(request, url, env, ctx);
					default:
						return res({ error: 'route not found' }, 403);
				}

			default:
				return res({ error: 'method not allowed' }, 405);
		}
	},

	async banHandler(request: Request, url: URL, env: Env, ctx: ExecutionContext) {
		const userId = url.searchParams.get('user_id');

		if (!userId) return res({ error: 'invalid user id' }, 401);

		// Get database result for the bans
		const dbResult = await env.DB.prepare('SELECT * FROM Bans WHERE UserId = ?').bind(userId).all();

		// Convert the database result into a Ban object (or null)
		const ban: Ban | null = dbResult.results[0]
			? {
					id: dbResult.results[0].UserId as string,
					reason: dbResult.results[0].Reason as string,
					expires: (dbResult.results[0].Expires as string) === 'false' ? false : (dbResult.results[0].Expires as string),
			  }
			: null;

		// If the ban is not null, the ban is able to expire and the ban has already expired, return a null ban
		if (ban?.expires && new Date(ban.expires).getTime() - Date.now() < 0) {
			return res({ banned: false, ban: null });
		}

		// If the ban is not null, return the ban
		if (ban) return res({ banned: true, ban }, 200);

		// The user is not banned, return null
		return res({ banned: false, ban }, 200);
	},
};
