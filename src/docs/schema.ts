import 'zod-openapi/extend';
import { z } from 'zod';
import { createDocument, ZodOpenApiOperationObject, ZodOpenApiResponseObject } from 'zod-openapi';
import { UnauthorizedResponse } from './types/unauthorizedResponseSchema.js';
import { GetBanPathParamsSchema, GetBanResponseSchema, GetBansResponseSchema } from './types/bans.js';
import { DiscordUserId } from './types/misc.js';

const getBansOperation: ZodOpenApiOperationObject = {
	operationId: 'getBans',
	summary: 'Get all bans',
	security: [{ bearerAuth: [] }],
	responses: {
		'200': {
			description: 'All bans currently registered',
			content: {
				'application/json': {
					schema: GetBansResponseSchema,
				},
			},
		},
		'401': UnauthorizedResponse,
	},
};

const getBanOperation: ZodOpenApiOperationObject = {
	operationId: 'getBan',
	summary: 'Get ban by user ID',
	requestParams: {
		path: GetBanPathParamsSchema,
	},
	responses: {
		'200': {
			description: 'All bans currently registered',
			content: {
				'application/json': {
					schema: GetBanResponseSchema,
				},
			},
		},
		'401': UnauthorizedResponse,
	},
};

const document = createDocument({
	openapi: '3.1.0',
	info: {
		title: 'nigga.church API',
		version: '1.0.0',
		description: 'Documentation for the nigga.church API',
	},
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description: 'Bearer JWT Authentication',
			},
		},
		responses: {
			unauthorizedResponse: UnauthorizedResponse,
		},
	},
	servers: [
		{
			url: 'https://api.nigga.church/v1',
			description: 'Production (v1)',
		},
	],

	paths: {
		'/bans': {
			get: getBansOperation,
		},
		'/ban/{userId}': {
			get: getBanOperation,
		},
	},
});

export default document;
