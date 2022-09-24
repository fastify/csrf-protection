/// <reference types="node" />

import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { Options as CSRFOptions } from "@fastify/csrf";
import { CookieSerializeOptions as FastifyCookieSerializeOptions } from "@fastify/cookie";

declare module 'fastify' {
  interface FastifyInstance {
    csrfProtection(req: FastifyRequest, reply: FastifyReply, done: () => void): any;
  }

  interface FastifyReply {
    /**
     * Generate a token and configure the secret if needed
     * @param options Serialize options
     */
    generateCsrf(
      options?: CookieSerializeOptions
    ): FastifyReply;
  }
}

export type CookieSerializeOptions = FastifyCookieSerializeOptions

export type GetTokenFn = (req: FastifyRequest) => string | void;

export interface FastifyCsrfOptions {
  csrfOpts?: CSRFOptions;
  cookieKey?: string;
  cookieOpts?: CookieSerializeOptions;
  sessionKey?: string;
  getUserInfo?: (req: FastifyRequest) => any;
  getToken?: GetTokenFn;
  sessionPlugin?: '@fastify/cookie' | '@fastify/session' | '@fastify/secure-session';
}

declare const fastifyCsrf: FastifyPluginAsync<FastifyCsrfOptions>;

export default fastifyCsrf;
