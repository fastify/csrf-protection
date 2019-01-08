'use strict'

const t = require('tap');
const test = t.test;
const Fastify = require('fastify');
const fastifyCookie = require('fastify-cookie');
const axios = require('axios');
const fastifyCsrf = require('../lib/fastifyCsrf');

test('should set _csrf key for cookie(default)', (t) => {
	t.plan(2)
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifyCsrf, { cookie: true });
	fastify.get('/', (request, reply) => {
		reply.send('Hello');
	});
	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({ 
				method: 'get', 
				url: 'http://localhost:' + fastify.server.address().port + '/'
		})
		.then(function(response) {
			var setCookie = response.headers['set-cookie'][0];
			t.equal(setCookie.indexOf('_csrf'), 0);
			t.end();
		})
		.catch(function(err) {
			t.error(err);
		});
	});
});