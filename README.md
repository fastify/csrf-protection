# fastify-csrf
A fastify csrf plugin.
Requires fastify-cookie (for cookie based CSRF token validation) or fastify-session (for session based)

# Usage
Cookie based token validation.

```js
const fastify = require('fastify');
const fastifyCookie = require('fastify-cookie);
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
