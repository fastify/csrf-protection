'use strict'

const Fastify = require('fastify');
const fastifyCookie = require('fastify-cookie');
const fastifyCSRF = require('../lib/fastifyCsrf');

test('a simple test', ()=>{
	const fastify = Fastify({logger: true});
	const options = { cookie: true };
	fastify.register(fastifyCookie);
	fastify.register(fastifyCSRF, options);
	fastify.listen(3000, err =>{
		if(err) {
			process.exit(0)
		}
		console.log('Listening on port 3000');
	});
})