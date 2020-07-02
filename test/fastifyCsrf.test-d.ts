import * as fastify from 'fastify';
import * as fastifyCookie from 'fastify-cookie';
import * as fastifyCSRF from '../lib/fastifyCsrf';

const server = fastify();
server.register(fastifyCookie);
server.register(fastifyCSRF, {
	cookie: true,
	ignoreMethods: ['GET'],
	key: '_custom_csrf',
	value: (req) => {
		return req.body['some_key'];
	},
});

server.get('/', (request, reply) => {
	var form = `
      <form method = "post" action="/data">
         <input type="text" name"field_name"/>
         <input type="hidden" value="${request.csrfToken()}" name="_csrf"/>
         <button type="submit">Submit</button>
      </form>
    `;
	reply.type('text/html').send(form);
});
