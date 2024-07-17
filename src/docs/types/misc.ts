import { z } from 'zod';

export const DiscordUserId = z.string().openapi({ description: 'Discord User ID Snowflake', example: '1217227943072497765' });

export const UserId = z.number().openapi({ description: 'API User ID', example: 5 });

export const DateTimeString = z
	.string()
	.openapi({ description: 'Date and Time String (Format: YYYY-MM-DD hh:mm:ss)', example: '2024-07-11 20:58:01' });
