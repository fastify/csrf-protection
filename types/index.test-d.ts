import Fastify from 'fastify'
import FastifyCookie from '@fastify/cookie'
import FastifyCsrfProtection from '..'
import { expectError } from 'tsd'

const fastify = Fastify()

async function run() {
  await fastify.register(FastifyCookie)
  await fastify.register(FastifyCsrfProtection)

  fastify.route({
    method: 'GET',
    url: '/',
    handler: async (req, reply) => {
      return reply.generateCsrf()
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
