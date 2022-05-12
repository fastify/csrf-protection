import Fastify from 'fastify'
import FastifyCookie from '@fastify/cookie'
import FastifyCsrf from '..'

async function run () {
  const fastify = Fastify()
  await fastify.register(FastifyCookie)
  await fastify.register(FastifyCsrf)

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
