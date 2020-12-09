# fastify-csrf

![Node.js CI](https://github.com/fastify/fastify-csrf/workflows/Node.js%20CI/badge.svg)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

A plugin for adding [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) protection to Fastify.  
If you want to learn more about CSRF, see [pillarjs/understanding-csrf](https://github.com/pillarjs/understanding-csrf) and [Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

> CSRF prevention must always be accompanied by other security measures. We recommend using [fastify-helmet](https://github.com/fastify/fastify-helmet)

# Install 
```js 
npm i fastify-csrf
```

## Usage

This plugins adds two new method to your code:

### `reply.generateCsrf([opts])`

Generates a secret (if is not already present) and returns a promise that resoves to the associated secret.

```js
const token = await reply.generateCsrf()
```

You can also pass the [cookie serialization](https://github.com/fastify/fastify-cookie) options to the function.

### `fastify.csrfProtection(request, reply, next)`

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

You can configure the function to read the CSRF token via the `getToken` option, by default the following is used:

```js
function getToken (req) {
  return (req.body && req.body._csrf) ||
    (req.query && req.query._csrf) ||
    req.headers['csrf-token'] ||
    req.headers['xsrf-token'] ||
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token']
}
```

### Use with [`fastify-cookie`](https://github.com/fastify/fastify-cookie)

If you use `fastify-csrf` with `fastify-cookie`, the CSRF secret will be added to the response cookies.
By default, the cookie used will be named `_csrf`, but you can rename it via the `cookieKey` option.

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

If you use `fastify-csrf` with `fastify-session`, the CSRF secret will be added to the session.
By default, the key used will be named `_csrf`, but you can rename it via the `sessionKey` option.

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

If you use `fastify-csrf` with `fastify-secure-session`, the CSRF secret will be added to the session.
By default, the key used will be named `_csrf`, but you can rename it via the `sessionKey` option.

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
| `cookieKey` |  The name of the cookie where the CSRF secret will be stored, default `_csrf`.     |
| `cookieOpts` |  The cookie serialization options. See [fastify-cookie](https://github.com/fastify/fastify-cookie).    |
| `sessionKey` |  The key where to store the CSRF secret in the session.     |
| `getToken` |  A sync function to get the CSRF secret from the request.     |
| `sessionPlugin` |  The session plugin that you are using (if applicable).     |
| `csrfOpts` |  The csrf options. See  [csrf](https://github.com/pillarjs/csrf).     |


## License

[MIT](./LICENSE)
