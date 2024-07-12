import { HandlerInterface } from 'hono/types';
import { TokenVariable } from './middleware/auth';
import { D1QB } from 'workers-qb';

export type Bindings = {
	DB: D1Database;
	DISCORD_CLIENT_ID: string;
	DISCORD_CLIENT_SECRET: string;
	DISCORD_REDIRECT_URI: string;
	JWT_SECRET: string;
};
export type HonoEnv = { Bindings: Bindings; Variables: { token?: TokenVariable; db: D1QB } };
export type Handler = HandlerInterface<HonoEnv>;

export type Jwt = {
	/**
	 * Subject - Identifier for the End-User (User-ID)
	 */
	uid: number;

	/**
	 * Name - Discord Username
	 */
	name: string;

	/**
	 * Discord User ID
	 */
	discord_user_id: string;

	/**
	 * Discord Access Token
	 */
	discord_access_token: string;

	/**
	 * Is Admin
	 */
	admin: boolean;

	/**
	 * Expires - Timestamp of expiry
	 */
	exp: number;

	/**
	 * Issued at - Timestamp when the token was issued
	 */
	iat: number;
};

export type SqlBoolean = 0 | 1;

export type Ban = {
	userId: string;
	createdAt: string;
	reason: string | null;
	expires: string | null;
};

export type Badge = {
	id: number;
	userId: string;
	badge: string;
	tooltip: string;
	badgeType: 'donor';
};

export type User = {
	id: number;
	discordUserId: string;
	isAdmin: SqlBoolean;
	apiKey: string | null;
};

export const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';

export function basicAuthHeader(username: string, password: string, includePrefix = true) {
	return `${includePrefix ? 'Bearer ' : ''}${btoa(`${username}:${password}`)}`;
}
