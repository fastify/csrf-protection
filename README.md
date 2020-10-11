# fastify-csrf

![Node.js CI](https://github.com/fastify/fastify-csrf/workflows/Node.js%20CI/badge.svg)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

A plugin for adding [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) protection to Fastify.

# Install 
```js 
npm i fastify-csrf
```

## Usage

This plugins adds two new method to your code:

### `reply.generateCsrf`

Generates a secret (if is not already present) and returns a promise that resoves to the associated secret.

```js
const token = await reply.generateCsrf()
```

### `fastify.csrfProtection`

A hook that you can use for protecting routes or enitre plugins from CSRF attacks.
Generally, we recommend to use the `onRequest` hook, but if you are sending the token
via the body, then you should use `preValidation` or `preHandler`.

```js
// protect the entire plugin
fastify.addHook('onRequest', fastify.csrfProtection)

// protect a single route
fastify.route({
  method: 'POST',
  path: '/',
  onRequest: fastify.csrfProtection
  handler: async (req, reply) => {
    return req.body
  }
})
```

### Use with [`fastify-cookie`](https://github.com/fastify/fastify-cookie)

```js
fastify.register(require('fastify-cookie'))
fastify.register(require('fastify-csrf'))

// if you want to sign cookies:
fastify.register(require('fastify-cookie'), { secret: 'supersecret' })
fastify.register(require('fastify-csrf'), { cookieOpts: { signed: true } })

// generate a token
fastify.route({
  method: 'GET',
  path: '/',
  handler: async (req, reply) => {
    const token = await reply.generateCsrf()
    return { token }
  }
})

// protect a route
fastify.route({
  method: 'POST',
  path: '/',
  onRequest: fastify.csrfProtection
  handler: async (req, reply) => {
    return req.body
  }
})
```

### Use with [`fastify-session`](https://github.com/SerayaEryn/fastify-session)

```js
fastify.register(require('fastify-session'))
fastify.register(require('fastify-csrf'), { sessionPlugin: 'fastify-session' })

// generate a token
fastify.route({
  method: 'GET',
  path: '/',
  handler: async (req, reply) => {
    const token = await reply.generateCsrf()
    return { token }
  }
})

// protect a route
fastify.route({
  method: 'POST',
  path: '/',
  onRequest: fastify.csrfProtection
  handler: async (req, reply) => {
    return req.body
  }
})
```

### Use with [`fastify-secure-session`](https://github.com/fastify/fastify-secure-session)

```js
fastify.register(require('fastify-secure-session'))
fastify.register(require('fastify-csrf'), { sessionPlugin: 'fastify-secure-session' })

// generate a token
fastify.route({
  method: 'GET',
  path: '/',
  handler: async (req, reply) => {
    const token = await reply.generateCsrf()
    return { token }
  }
})

// protect a route
fastify.route({
  method: 'POST',
  path: '/',
  onRequest: fastify.csrfProtection
  handler: async (req, reply) => {
    return req.body
  }
})
```

### Options
| Options      | Description |
| ----------- | ----------- |
| `cookieName` |  The name of the cookie where the CSRF secret will be stored, default `_csrf`.     |
| `cookieOpts` |  The cookie serialization options. See [fastify-cookie](https://github.com/fastify/fastify-cookie).    |
| `sessionKey` |  The key where to store the CSRF secret in the session     |
| `getToken` |  A sync function to get the CSRF secret from the request     |
| `sessionPlugin` |  The session plugin that you are using (if applicable)     |


## License
[MIT](./LICENSE)
