# fastify-csrf
A fastify csrf plugin.
Requires fastify-cookie (for cookie based CSRF token validation) or fastify-session (for session based)

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
  { cookie: true, ignoreMethods: ['GET', 'HEAD', /* other request type */] 
  ``` 
 ignoreMethods takes a array of request type to skip validation for particular request type.
 Other properties related to cookie can be set normally.
 
 ```js 
  { cookie: { path: '/', maxAge: /* your maxAge value */, expires: /* cookie expiry time */ , /* other cookie properties */
  ```
 
Session based validation options
For using session validation, skip cookie option and use other options according to you requirements.
```js 
 { key: 'your_secret_key_name', ignoreMethods: [/* request types */] }
 ```
 fastify-csrf uses fastify-session for sessions. Thus any option support by fastify-session is also valid for fastify-csrf.

# Usage
Cookie based token validation.

```js
const fastify = require('fastify');
const fastifyCookie = require('fastify-cookie');
const fasifyCSRF = require('fastify-csrf');

fastify.register(fastifyCookie);
fastify.register(fastifyCSRF, { cookie: true });

fastify.get('/', (request, reply) => {
  var form = `
      <form method = "post" action="/data">
         <input type="text" name"field_name"/>
         <input type="hidden" value="${ request.csrfToken() }" name="_csrf"/>
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
}
```
fastify-csrf depends on fastify-cookie so require it first. Set { cookie: true } for setting a cookie defaults to '_csrf', for setting different name use { cookie: true, key: '_csrf_custom' }. Create a hidden field with name '_csrf' which will store token. 
