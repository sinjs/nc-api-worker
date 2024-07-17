import { z } from 'zod';
import { DateTimeString, DiscordUserId } from './misc.js';

export const BanSchema = z
	.object({
		userId: DiscordUserId,
		createdAt: DateTimeString,
		reason: z.string().nullish(),
		expires: DateTimeString.nullish().openapi({ example: '2024-08-11 20:58:01' }),
	})
	.openapi({ description: 'Ban Object' });

export const GetBansResponseSchema = z.array(BanSchema);

export const GetBanResponseSchema = z
	.object({
		banned: z.literal(false).openapi({ example: false }),
	})
	.or(
		z.object({
			banned: z.literal(true),
			ban: BanSchema,
		}),
	);

export const GetBanPathParamsSchema = z.object({
	userId: DiscordUserId,
});
