/// <reference types="node" />

import { FastifyPlugin, FastifyRequest } from 'fastify';

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

export interface CookieSerializeOptions {
  domain?: string;
  encode?(val: string): string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  secure?: boolean;
  signed?: boolean;
}

export type GetTokenFn = (req: FastifyRequest) => string | void;

export interface FastifyCsrfOptions {
  cookieKey?: string;
  cookieOpts?: CookieSerializeOptions;
  sessionKey?: string;
  getToken?: GetTokenFn;
  sessionPlugin?: '@fastify/cookie' | '@fastify/session' | '@fastify/secure-session';
}

declare const fastifyCsrf: FastifyPlugin<FastifyCsrfOptions>;

export default fastifyCsrf;
