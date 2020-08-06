/// <reference types='node' />

import { Options as TokenOptions } from 'csrf';
import 'fastify-cookie';
import { FastifyRequest, FastifyPlugin } from 'fastify';
import { CookieSerializeOptions } from 'fastify-cookie';

declare module 'fastify' {
	interface FastifyRequest {
		csrfToken(): string;
	}
}

interface Options extends TokenOptions {
	key?: string;
	value?: (req: FastifyRequest) => string;
	cookie?: CookieSerializeOptions | boolean;
	ignoreMethods?: string[];
}

declare const fastifyCsrf: FastifyPlugin<Options>;

export default fastifyCsrf;
