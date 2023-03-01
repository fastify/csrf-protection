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
      options?: fastifyCsrfProtection.CookieSerializeOptions
    ): string;
  }
}

type FastifyCsrfProtection = FastifyPluginAsync<fastifyCsrfProtection.FastifyCsrfOptions>;

declare namespace fastifyCsrfProtection {
  export type CookieSerializeOptions = FastifyCookieSerializeOptions

  export type GetTokenFn = (req: FastifyRequest) => string | void;
  
  export interface FastifyCsrfProtectionOptions {
    csrfOpts?: CSRFOptions;
    cookieKey?: string;
    cookieOpts?: CookieSerializeOptions;
    sessionKey?: string;
    getUserInfo?: (req: FastifyRequest) => string;
    getToken?: GetTokenFn;
    sessionPlugin?: '@fastify/cookie' | '@fastify/session' | '@fastify/secure-session';
  }

  /**
   * @deprecated Use FastifyCsrfProtectionOptions instead
   */
  export type FastifyCsrfOptions = FastifyCsrfProtectionOptions;

  export const fastifyCsrfProtection: FastifyCsrfProtection
  export { fastifyCsrfProtection as default }
}


declare function fastifyCsrfProtection(...params: Parameters<FastifyCsrfProtection>): ReturnType<FastifyCsrfProtection>
export = fastifyCsrfProtection
