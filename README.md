[![Build Status](https://travis-ci.org/Tarang11/fastify-csrf.png?branch=master)](https://travis-ci.org/Tarang11/fastify-csrf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

# fastify-csrf
A fastify csrf plugin.
Requires fastify-cookie (for cookie based CSRF token validation) or fastify-session (for session based)
# Install 
```js 
npm i fastify-csrf
```

# API
 ## csrf(fastify, options, next)
 csrf will decorate request with a csrfToken(). It will generate token for validating request.
 
 ### options 
 #### cookie
 cookie set to true will use cookie for storing _csrf secret in browser cookie.
 ```js 
  { cookie: true } 
 ```

 #### key 
 ```js 
  { cookie: true, key: '_csrf_custom' }
 ```
 this will set cookie with a name _csrf_custom.
 
 #### ignoreMethods 
 
 ```js 
  { cookie: true, ignoreMethods: ['GET', 'HEAD', /* other request type */] }
  ``` 
 ignoreMethods takes a array of request type to skip validation for particular request type.
 Other properties related to cookie can be set normally.
 
 ```js 
  { cookie: { path: '/', maxAge: /* your maxAge value */, expires: /* cookie expiry time */ ,/* other cookie properties */}}
  ```
 
Session based validation options
For using session validation, skip cookie option and use other options according to your requirement.
```js 
 { key: 'your_secret_key_name', ignoreMethods: [/* request types */] }
 ```
 fastify-csrf uses fastify-session for sessions. Thus any option support by fastify-session is also valid for fastify-csrf.

# Usage
Cookie based token validation.

```js
const fastify = require('fastify')();
const fastifyCookie = require('fastify-cookie');
const fastifyFormBody = require('fastify-formbody');
const fastifyCSRF = require('fastify-csrf');

fastify.register(fastifyCookie);
fastify.register(fastifyFormBody);
fastify.register(fastifyCSRF, { cookie: true });

fastify.get('/', (request, reply) => {
  var form = `
      <form method = "post" action="/data">
         <input type="text" name"field_name"/>
         <input type="hidden" value="${ request.csrfToken() }" 
	 name="_csrf /* this token can be sent in request header as well */"/>
         <button type="submit">Submit</button>
      </form>
    `;
   reply.type('text/html').send(form);
});

fastify.post('/data', (request, reply) => {
  reply.send('Post successful');
});

fastify.listen(3000, (err) => {
  if(err) {
    process.exit(0);
   }
})
```
fastify-csrf depends on fastify-cookie so require it first. Set { cookie: true } for setting a cookie defaults to '_csrf', for setting different name use { cookie: true, key: '_csrf_custom' }. Create a hidden field with name '_csrf' which will store token. 

Session based token validation.

```js
const fastify = require('fastify')();
const fastifyCookie = require('fastify-cookie');
const fastifyFormBody = require('fastify-formbody');
const fastifySession = require('fastify-session');
const RedisStore = require('connect-redis')(fastifySession);
const fastifyCSRF = require('fastify-csrf');

fastify.register(fastifyCookie);
fastify.register(fastifyFormBody);
fastify.register(fastifySession, { cookieName: '_ses', cookie: { path: '/',secure: false },  
secret: 'a secret with minimum length of 32 characters', store: new RedisStore(/* redis configurations */) });
fastify.register(fastifyCSRF, { key: '_csrf', ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] });

fastify.get('/',(request, reply) => {
	var form = `
		<form method="post" action="/data">
			<input type="text" name="user"/>
			<input type="hidden" value ="${ request.csrfToken() }" 
			name="_csrf /* this token can be sent in request header as well */"/>
			<button type="submit">Submit </buttion>
		</form>
	`;
	reply.type('text/html').send(form);
});

fastify.post('/data',(request, reply) => {
 reply.send('Post successful');
});

fastify.listen(3000,(err) => {
	if(err) {
		process.exit(0);
	}
});
```

fastify-csrf will use redis to store csrf token with a name given in key (in this case its, _csrf, custom name can be given).

Token can be sent in request header. Token is read in following order.
  - `request.body._csrf` - will read from request body.
  - `request.query._csrf` - to read from the URL query string.
  - `request.headers['csrf-token']` - the `CSRF-Token` HTTP request header.
  - `request.headers['xsrf-token']` - the `XSRF-Token` HTTP request header.
  - `request.headers['x-csrf-token']` - the `X-CSRF-Token` HTTP request header.
  - `request.headers['x-xsrf-token']` - the `X-XSRF-Token` HTTP request header.
  
#### Note: fastify-csrf is inspired by expressjs/csurf. For any other detail please visit expessjs/csurf.
