/// <reference types='node' />

import * as http from 'http';
import * as fastify from 'fastify';
import { Options as TokenOptions } from 'csrf';
import 'fastify-cookie';

type HttpServer = http.Server;
type HttpRequest = http.IncomingMessage;
type HttpResponse = http.ServerResponse;

declare module 'fastify' {
	interface FastifyRequest {
		csrfToken(): string;
	}
}

interface Options extends TokenOptions {
	key?: string;
	value?: (req: fastify.FastifyRequest) => string;
	cookie?: fastify.CookieSerializeOptions | boolean;
	ignoreMethods?: string[];
}

declare const fastifyCsrf: fastify.Plugin<
	HttpServer,
	HttpRequest,
	HttpResponse,
	Options
>;

export = fastifyCsrf;
