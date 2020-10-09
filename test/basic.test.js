'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const fastifyCookie = require('fastify-cookie')
const fastifySession = require('fastify-session')
const fastifySecureSession = require('fastify-secure-session')
const fastifyCsrf = require('../index')

const sodium = require('sodium-native')
const key = Buffer.alloc(sodium.crypto_secretbox_KEYBYTES)
sodium.randombytes_buf(key)

test('Cookies', t => {
  async function load () {
    const fastify = Fastify()
    await fastify.register(fastifyCookie)
    await fastify.register(fastifyCsrf)
    return fastify
  }
  runTest(t, load)
  t.end()
})

test('Fastify Session', t => {
  async function load () {
    const fastify = Fastify()
    await fastify.register(fastifyCookie)
    await fastify.register(fastifySession, {
      secret: 'a'.repeat(32),
      cookie: { path: '/', secure: false }
    })
    await fastify.register(fastifyCsrf, { sessionPlugin: 'fastify-session' })
    return fastify
  }
  runTest(t, load, 'preValidation')
  t.end()
})

test('Fastify Secure Session', t => {
  async function load () {
    const fastify = Fastify()
    await fastify.register(fastifySecureSession, { key, cookie: { path: '/', secure: false } })
    await fastify.register(fastifyCsrf, { sessionPlugin: 'fastify-secure-session' })
    return fastify
  }
  runTest(t, load)
  t.end()
})

function runTest (t, load, hook = 'onRequest') {
  t.test('Token in query', async t => {
    const fastify = await load()

    fastify.get('/', async (req, reply) => {
      const token = await reply.generateCsrf()
      return { token }
    })

    fastify.post('/', { [hook]: fastify.csrfProtection }, async (req, reply) => {
      return req.body
    })

    let response = await fastify.inject({
      method: 'GET',
      path: '/'
    })

    t.strictEqual(response.statusCode, 200)
    const cookie = response.cookies[0]
    const token = response.json().token

    response = await fastify.inject({
      method: 'POST',
      path: `/?_csrf=${token}`,
      payload: { hello: 'world' },
      cookies: {
        [cookie.name]: cookie.value
      }
    })

    t.strictEqual(response.statusCode, 200)
    t.deepEqual(response.json(), { hello: 'world' })

    response = await fastify.inject({
      method: 'POST',
      path: '/',
      payload: { hello: 'world' }
    })

    t.strictEqual(response.statusCode, 403)
    t.match(response.json(), { message: 'Missing csrf secret' })

    response = await fastify.inject({
      method: 'POST',
      path: '/',
      payload: { hello: 'world' },
      cookies: {
        [cookie.name]: cookie.value
      }
    })

    t.strictEqual(response.statusCode, 403)
    t.match(response.json(), { message: 'Invalid csrf token' })
  })
}
