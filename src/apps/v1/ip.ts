import { Hono } from 'hono';
import { HonoEnv } from '../../util.js';
import { rateLimiter } from 'hono-rate-limiter';
import { z } from 'zod';
import { WorkersKVStore } from '../../lib/KVStore.js';

/**
 * Mounted at `/v1/ip`
 */
const app = new Hono<HonoEnv>();

app.use((c, next) =>
	rateLimiter<HonoEnv>({
		windowMs: 60 * 1000, // 1 minute
		limit: 25,
		standardHeaders: 'draft-6',
		keyGenerator: (c) => c.req.header('cf-connecting-ip') ?? '',
		store: new WorkersKVStore({ namespace: c.env.CACHE }),
		message: { error: 'Too Many Requests' },
	})(c, next),
);

type BaseResult = { query: string };
type SuccessResult = {
	status: 'success';
	country: string;
	countryCode: string;
	region: string;
	regionName: string;
	city: string;
	zip: string;
	lat: number;
	lon: number;
	timezone: string;
	isp: string;
	org: string;
	as: string;
};
type FailResult = {
	status: 'fail';
	message: string;
};

type Result = BaseResult & (SuccessResult | FailResult);

app.get('/', async (c) => {
	const ip = z.string().ip().parse(c.req.query('ip'));
	const cache = c.env.CACHE;

	const cacheKey = `ip:${ip}`;
	const cachedResult = await cache.get<Result>(cacheKey, 'json');

	if (cachedResult) {
		return c.json(cachedResult);
	}

	const response = await fetch(`http://ip-api.com/json/${ip}`);
	if (response.status !== 200) return c.json({ error: 'Internal Server Error', message: 'Failed to obtain IP information' }, 500);
	const result = (await response.json()) as Result;

	c.executionCtx.waitUntil(
		cache.put(cacheKey, JSON.stringify(result), {
			expirationTtl: 24 * 60 * 60, // one day
		}),
	);
	return c.json(result);
});

export default app;
