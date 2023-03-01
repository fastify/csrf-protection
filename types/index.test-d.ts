import Fastify from 'fastify'
import FastifyCookie from '@fastify/cookie'
import FastifyCsrfProtection, { FastifyCsrfOptions } from '..'
import { expectError, expectDeprecated, expectType } from 'tsd'
import FastifySession from '@fastify/session'

const fastify = Fastify()

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


fastify.register(FastifyCsrfProtection, { csrfOpts: { algorithm: 'sha1' } })
expectError(fastify.register(FastifyCsrfProtection, { csrfOpts: { algorithm: 1 } }))

fastify.register(FastifySession)
fastify.register(FastifyCsrfProtection, { getUserInfo(req) {
  return req.session.get('username')
}})
expectError(fastify.register(FastifyCsrfProtection, { getUserInfo: 'invalid' }))

expectDeprecated({} as FastifyCsrfOptions)
