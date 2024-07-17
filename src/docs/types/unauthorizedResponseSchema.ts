import { z } from 'zod';
import { ZodOpenApiResponseObject } from 'zod-openapi';

export const UnauthorizedResponseSchema = z
	.object({
		error: z.literal('Unauthorized').openapi({ example: 'Unauthorized' }),
		message: z.string().optional(),
	})
	.openapi({
		description: 'Unauthorized Error',
		ref: 'UnauthorizedResponseSchema',
	});

export const UnauthorizedResponse: ZodOpenApiResponseObject = {
	description: '401 Unauthorized',
	content: { 'application/json': { schema: UnauthorizedResponseSchema } },
};
