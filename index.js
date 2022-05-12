'use strict'

const assert = require('assert')
const fp = require('fastify-plugin')
const CSRF = require('@fastify/csrf')
const { Forbidden } = require('http-errors')

const defaultOptions = {
  cookieKey: '_csrf',
  cookieOpts: { path: '/', sameSite: true, httpOnly: true },
  sessionKey: '_csrf',
  getToken: getTokenDefault,
  getUserInfo: getUserInfoDefault,
  sessionPlugin: '@fastify/cookie'
}

async function csrfPlugin (fastify, opts) {
  const {
    cookieKey,
    cookieOpts,
    sessionKey,
    getToken,
    getUserInfo,
    sessionPlugin
  } = Object.assign({}, defaultOptions, opts)

  const csrfOpts = opts && opts.csrfOpts ? opts.csrfOpts : {}

  assert(typeof cookieKey === 'string', 'cookieKey should be a string')
  assert(typeof sessionKey === 'string', 'sessionKey should be a string')
  assert(typeof getToken === 'function', 'getToken should be a function')
  assert(typeof getUserInfo === 'function', 'getUserInfo should be a function')
  assert(typeof cookieOpts === 'object', 'cookieOpts should be a object')
  assert(
    ['@fastify/cookie', '@fastify/session', '@fastify/secure-session'].includes(sessionPlugin),
    "sessionPlugin should be one of the following: '@fastify/cookie', '@fastify/session', '@fastify/secure-session'"
  )

  if (opts.getUserInfo) {
    csrfOpts.userInfo = true
  }
  const tokens = new CSRF(csrfOpts)

  const isCookieSigned = cookieOpts && cookieOpts.signed

  if (sessionPlugin === '@fastify/secure-session') {
    fastify.decorateReply('generateCsrf', generateCsrfSecureSession)
  } else if (sessionPlugin === '@fastify/session') {
    fastify.decorateReply('generateCsrf', generateCsrfSession)
  } else {
    fastify.decorateReply('generateCsrf', generateCsrfCookie)
  }

  fastify.decorate('csrfProtection', csrfProtection)

  async function generateCsrfCookie (opts) {
    let secret = isCookieSigned
      ? this.unsignCookie(this.request.cookies[cookieKey] || '').value
      : this.request.cookies[cookieKey]
    const userInfo = opts ? opts.userInfo : undefined
    if (!secret) {
      secret = await tokens.secret()
      this.setCookie(cookieKey, secret, Object.assign({}, cookieOpts, opts))
    }
    return tokens.create(secret, userInfo)
  }

  async function generateCsrfSecureSession (opts) {
    let secret = this.request.session.get(sessionKey)
    if (!secret) {
      secret = await tokens.secret()
      this.request.session.set(sessionKey, secret)
    }
    const userInfo = opts ? opts.userInfo : undefined
    if (opts) {
      this.request.session.options(opts)
    }
    return tokens.create(secret, userInfo)
  }

  async function generateCsrfSession (opts) {
    let secret = this.request.session[sessionKey]
    const userInfo = opts ? opts.userInfo : undefined
    if (!secret) {
      secret = await tokens.secret()
      this.request.session[sessionKey] = secret
    }
    return tokens.create(secret, userInfo)
  }

  function csrfProtection (req, reply, next) {
    const secret = getSecret(req, reply)
    if (!secret) {
      req.log.warn('Missing csrf secret')
      return reply.send(new Forbidden('Missing csrf secret'))
    }
    if (!tokens.verify(secret, getToken(req), getUserInfo(req))) {
      req.log.warn('Invalid csrf token')
      return reply.send(new Forbidden('Invalid csrf token'))
    }
    next()
  }

  function getSecret (req, reply) {
    if (sessionPlugin === '@fastify/secure-session') {
      return req.session.get(sessionKey)
    } else if (sessionPlugin === '@fastify/session') {
      return req.session[sessionKey]
    } else {
      return isCookieSigned
        ? reply.unsignCookie(req.cookies[cookieKey] || '').value
        : req.cookies[cookieKey]
    }
  }
}

function getTokenDefault (req) {
  return (req.body && req.body._csrf) ||
    req.headers['csrf-token'] ||
    req.headers['xsrf-token'] ||
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token']
}

function getUserInfoDefault (req) {
  return undefined
}

module.exports = fp(csrfPlugin, {
  fastify: '4.x',
  name: '@fastify/csrf-protection'
})
