import Fastify from 'fastify'
import FastifyCookie from '@fastify/cookie'
import FastifyCsrfProtection, { FastifyCsrfOptions } from '..'
import { expectError, expectDeprecated, expectType } from 'tsd'
import FastifySession from '@fastify/session'

const fastify = Fastify()

declare module 'fastify' {
  interface Session {
    username: string
  }
}

async function run() {
  await fastify.register(FastifyCookie)
  await fastify.register(FastifyCsrfProtection)

  fastify.route({
    method: 'GET',
    url: '/',
    handler: async (req, reply) => {
      const token = reply.generateCsrf()
      expectType<string>(token)
      return token
    }
  })

  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: fastify.csrfProtection,
    handler: async (req, reply) => {
      return req.body
    }
  })
}


fastify.register(FastifyCsrfProtection, { csrfOpts: { algorithm: 'sha1', hmacKey: 'hmac' } })
expectError(fastify.register(FastifyCsrfProtection, { csrfOpts: { algorithm: 1 } }))

fastify.register(FastifySession)
fastify.register(FastifyCsrfProtection, {
  csrfOpts: {
    hmacKey: '123'
  },
  getUserInfo(req) {
    return req.session.get<'username', string>('username')
  }
})
expectError(fastify.register(FastifyCsrfProtection, { getUserInfo: 'invalid' }))

fastify.register(FastifyCsrfProtection, { csrfOpts: { hmacKey: 'hmac' }, sessionPlugin: '@fastify/cookie' })
fastify.register(FastifyCsrfProtection, { csrfOpts: { hmacKey: 'hmac' } })
fastify.register(FastifyCsrfProtection, { })
fastify.register(FastifyCsrfProtection, { csrfOpts: { }})
expectError(fastify.register(FastifyCsrfProtection, { sessionPlugin: '@fastify/cookie', csrfOpts: { userInfo: true}}))
fastify.register(FastifyCsrfProtection, { sessionPlugin: '@fastify/cookie', csrfOpts: { userInfo: true, hmacKey: 'key'}})
fastify.register(FastifyCsrfProtection, { sessionPlugin: '@fastify/cookie'})
fastify.register(FastifyCsrfProtection, { csrfOpts: { }, sessionPlugin: '@fastify/session' })
fastify.register(FastifyCsrfProtection, { csrfOpts: { }, sessionPlugin: '@fastify/secure-session' })
fastify.register(FastifyCsrfProtection, { sessionPlugin: '@fastify/session' })
fastify.register(FastifyCsrfProtection, { sessionPlugin: '@fastify/secure-session' })

expectDeprecated({} as FastifyCsrfOptions)
