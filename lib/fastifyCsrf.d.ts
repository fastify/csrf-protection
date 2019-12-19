/// <reference types="node" />
import * as fastify from 'fastify';
import { Options as TokenOptions } from 'csrf';
import 'fastify-cookie';

declare module 'fastify' {
    interface FastifyRequest<HttpRequest,
        Query = fastify.DefaultQuery,
        Params = fastify.DefaultParams,
        Headers = fastify.DefaultHeaders,
        Body = any> {
        csrfToken(): string;
    }
}

declare function FastifyCsrfPlugin<
    HttpServer = any,
    HttpRequest = any,
    HttpResponse = any>(opts?: FastifyCsrfPlugin.Options<HttpRequest>): FastifyCsrfPlugin.Plugin<
    HttpServer,
    HttpRequest,
    HttpResponse>;

declare namespace FastifyCsrfPlugin {
    interface Options<HttpRequest> extends TokenOptions {
        value?: (req: HttpRequest) => string;
        cookie?: fastify.CookieSerializeOptions | boolean;
        ignoreMethods?: string[];
        sessionKey?: string;
    }

    interface Plugin<HttpServer, HttpRequest, HttpResponse>
        extends fastify.Plugin<HttpServer, HttpRequest, HttpResponse, FastifyCsrfPlugin.Options<HttpRequest>> {
    }
}

export = FastifyCsrfPlugin;
