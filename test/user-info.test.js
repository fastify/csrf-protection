'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const fastifyCookie = require('@fastify/cookie')
const fastifySession = require('@fastify/session')
const fastifySecureSession = require('@fastify/secure-session')
const fastifyCsrf = require('../')

const sodium = require('sodium-native')
const key = Buffer.alloc(sodium.crypto_secretbox_KEYBYTES)
sodium.randombytes_buf(key)

test('Cookies with User-Info', async t => {
  const fastify = Fastify()
  await fastify.register(fastifyCookie)
  await fastify.register(fastifyCsrf, {
    getUserInfo (req) {
      return userInfoDB[req.body.username]
    }
  })

  const userInfoDB = {
    foo: 'a42'
  }

  fastify.post('/login', async (req, reply) => {
    const token = await reply.generateCsrf({ userInfo: userInfoDB[req.body.username] })
    return { token }
  })

  // must be preHandler as we are parsing the body
  fastify.post('/', { preHandler: fastify.csrfProtection }, async (req, reply) => {
    return req.body
  })

  const response1 = await fastify.inject({
    method: 'POST',
    path: '/login',
    body: {
      username: 'foo'
    }
  })

  t.equal(response1.statusCode, 200)

  const cookie1 = response1.cookies[0]
  const { token } = response1.json()

  const response2 = await fastify.inject({
    method: 'POST',
    path: '/',
    cookies: {
      _csrf: cookie1.value
    },
    body: {
      _csrf: token,
      username: 'foo'
    }
  })

  t.equal(response2.statusCode, 200)
})

test('Session with User-Info', async t => {
  const fastify = Fastify()
  await fastify.register(fastifyCookie)
  await fastify.register(fastifySession, {
    secret: 'a'.repeat(32),
    cookie: { path: '/', secure: false }
  })
  await fastify.register(fastifyCsrf, {
    sessionPlugin: '@fastify/session',
    getUserInfo (req) {
      return req.session.username
    }
  })

  fastify.post('/login', async (req, reply) => {
    req.session.username = req.body.username
    const token = await reply.generateCsrf({ userInfo: req.body.username })
    return { token }
  })

  // must be preHandler as we are parsing the body
  fastify.post('/', { preHandler: fastify.csrfProtection }, async (req, reply) => {
    return req.body
  })

  const response1 = await fastify.inject({
    method: 'POST',
    path: '/login',
    body: {
      username: 'foo'
    }
  })

  t.equal(response1.statusCode, 200)

  const cookie1 = response1.cookies[0]
  const { token } = response1.json()

  const response2 = await fastify.inject({
    method: 'POST',
    path: '/',
    cookies: {
      sessionId: cookie1.value
    },
    body: {
      _csrf: token,
      username: 'foo'
    }
  })

  t.equal(response2.statusCode, 200)
})

test('SecureSession with User-Info', async t => {
  const fastify = Fastify()
  await fastify.register(fastifySecureSession, { key, cookie: { path: '/', secure: false } })
  await fastify.register(fastifyCsrf, {
    sessionPlugin: '@fastify/secure-session',
    getUserInfo (req) {
      return req.session.get('username')
    }
  })

  fastify.post('/login', async (req, reply) => {
    req.session.set('username', req.body.username)
    const token = await reply.generateCsrf({ userInfo: req.body.username })
    return { token }
  })

  // must be preHandler as we are parsing the body
  fastify.post('/', { preHandler: fastify.csrfProtection }, async (req, reply) => {
    return req.body
  })

  const response1 = await fastify.inject({
    method: 'POST',
    path: '/login',
    body: {
      username: 'foo'
    }
  })

  t.equal(response1.statusCode, 200)

  const cookie1 = response1.cookies[0]
  const { token } = response1.json()

  const response2 = await fastify.inject({
    method: 'POST',
    path: '/',
    cookies: {
      session: cookie1.value
    },
    body: {
      _csrf: token,
      username: 'foo'
    }
  })

  t.equal(response2.statusCode, 200)
})
