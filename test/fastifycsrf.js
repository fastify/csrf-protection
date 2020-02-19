'use strict'

const t = require('tap');
const test = t.test;
const Fastify = require('fastify');
const fastifyCookie = require('fastify-cookie');
const fastifySession = require('fastify-session');
const fastifyFormBody = require('fastify-formbody');
const RedisStore = require('connect-redis')(fastifySession);
const axios = require('axios');
const cookie = require('cookie');
const fastifyCsrf = require('../lib/fastifyCsrf');
const qs = require('qs');

test('should set _csrf key for cookie(default)', (t) => {
	t.plan(2)
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifyCsrf, { cookie: true });
	fastify.get('/', (request, reply) => {
		reply.send(200);
	});
	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({
				method: 'get',
				url: 'http://localhost:' + fastify.server.address().port + '/'
		})
		.then(function(response) {
			var csrfCookie = response.headers['set-cookie'][0];
			t.equal(csrfCookie.indexOf('_csrf'), 0);
			t.end();
		})
		.catch(function(err) {
			t.error(err);
		});
	});
});

test('should set _csrf_custom for cookie', (t) => {
	t.plan(2);
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifyCsrf, { cookie: { key: '_csrf_custom' }});

	fastify.get('/', (request, reply) => {
		reply.send(200);
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);

		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then(function(response) {
			var csrfCookie = response.headers['set-cookie'][0];
			t.equal(csrfCookie.indexOf('_csrf_custom'), 0);
			t.end();
		})
		.catch(function(err) {
			t.error(err);
		})
	})
});

test('should test full cookie attribute', (t) => {
	t.plan(6);
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	let cookieOptions = { key: '_csrf_custom' , path: '/path' , httpOnly: true, expires: (new Date(+new Date() + 10000)), secure: true };
	fastify.register(fastifyCsrf, { cookie: cookieOptions });

	fastify.get('/', (request, reply) => {
		reply.send(200);
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);

		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then(function(response) {
			var csrfCookie = response.headers['set-cookie'][0];
			var receivedCookie = cookie.parse(csrfCookie);
			t.match(csrfCookie.indexOf('HttpOnly'),/[0-9]*/);
			t.match(csrfCookie.indexOf('Secure'),/[0-9]*/);
			t.equal(csrfCookie.indexOf('_csrf_custom'), 0);
			t.equal(receivedCookie['Path'], cookieOptions.path);
			t.equal(parseInt(+new Date(receivedCookie['Expires'])/ 1000), parseInt(+new Date(cookieOptions.expires)/ 1000));
			t.end();
		})
		.catch(function(err) {
			t.error(err);
		})
	})
});

test('csrf token authentication (default)', (t) => {
	t.plan(2);
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifyFormBody);
	fastify.register(fastifyCsrf, { cookie: true });

	fastify.get('/', (request, reply) => {
		reply.send({ csrf_secret: request.csrfToken() });
	});

	fastify.post('/data', (request, reply) => {
		reply.send({ status: 'ok' });
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then((response) => {
			let receivedCookie = cookie.parse(response.headers['set-cookie'][0]);
			axios({
				url: 'http://localhost:'+ fastify.server.address().port+'/data',
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					"Content-Type": "application/x-www-form-urlencoded",
					'Cookie': `${ response.headers['set-cookie'][0] }`
				},
				data: qs.stringify({ "_csrf": response.data.csrf_secret }),
			})
			.then((response) => {
				t.equal(response.data.status, 'ok');
				t.end();
			})
			.catch((err) => {
				t.error(err, 'invalid csrf token');
				t.end();
			});

		})
		.catch((err) => {
			t.error(err);
			t.end()
		});
	});
});

test('csrf token authentication using a signed cookie', (t) => {
	t.plan(2)
	const fastify = Fastify();
	fastify.register(fastifyCookie, {
		secret: 'fastify-csrf-secret',
	});
	fastify.register(fastifyFormBody);
	fastify.register(fastifyCsrf, {
		cookie: {
			signed: true,
		},
	});

	fastify.get('/', (request, reply) => {
		reply.send({ csrf_secret: request.csrfToken() });
	});

	fastify.post('/data', (request, reply) => {
		reply.send({ status: 'ok' });
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then((response) => {
			let receivedCookie = cookie.parse(response.headers['set-cookie'][0]);
			axios({
				url: 'http://localhost:'+ fastify.server.address().port+'/data',
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					"Content-Type": "application/x-www-form-urlencoded",
					'Cookie': `${ response.headers['set-cookie'][0] }`
				},
				data: qs.stringify({ "_csrf": response.data.csrf_secret }),
			})
				.then((response) => {
					t.equal(response.data.status, 'ok');
					t.end();
				})
				.catch((err) => {
					t.error(err, 'invalid csrf token');
					t.end();
				});

		})
		.catch((err) => {
			t.error(err);
			t.end()
		});
	});
});

test('csrf token authentication header based(csrf-token)', (t) => {
	t.plan(2);
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifyFormBody);
	fastify.register(fastifyCsrf, { cookie: true });

	fastify.get('/', (request, reply) => {
		reply.send({ csrf_secret: request.csrfToken() });
	});

	fastify.post('/data', (request, reply) => {
		reply.send({ status: 'ok' });
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then((response) => {
			let receivedCookie = cookie.parse(response.headers['set-cookie'][0]);
			axios({
				url: 'http://localhost:'+ fastify.server.address().port+'/data',
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					"Content-Type": "application/x-www-form-urlencoded",
					'Cookie': `${ response.headers['set-cookie'][0] }`,
					'csrf-token': `${ response.data.csrf_secret }`
				}
			})
			.then((response) => {
				t.equal(response.data.status, 'ok');
				t.end();
			})
			.catch((err) => {
				t.error(err, 'invalid csrf token');
				t.end();
			});

		})
		.catch((err) => {
			t.error(err);
			t.end()
		});
	});
});


test('csrf token authentication query based(_csrf)', (t) => {
	t.plan(2);
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifyFormBody);
	fastify.register(fastifyCsrf, { cookie: true });

	fastify.get('/', (request, reply) => {
		reply.send({ csrf_secret: request.csrfToken() });
	});

	fastify.post('/data', (request, reply) => {
		reply.send({ status: 'ok' });
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then((response) => {
			let receivedCookie = cookie.parse(response.headers['set-cookie'][0]);
			axios({
				url: 'http://localhost:'+ fastify.server.address().port+'/data?_csrf='+response.data.csrf_secret,
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					"Content-Type": "application/x-www-form-urlencoded",
					'Cookie': `${ response.headers['set-cookie'][0] }`
				}
			})
			.then((response) => {
				t.equal(response.data.status, 'ok');
				t.end();
			})
			.catch((err) => {
				t.error(err, 'invalid csrf token');
				t.end();
			});

		})
		.catch((err) => {
			t.error(err);
			t.end()
		});
	});
});

test('csrf token authentication session based (defaults: memory store, _csrf session token)', (t) => {
	t.plan(2);
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifySession, { cookieName: '_ses', cookie: { path: '/',secure: false },  secret: 'a secret with minimum length of 32 characters' });
	fastify.register(fastifyFormBody);
	fastify.register(fastifyCsrf);

	fastify.get('/', (request, reply) => {
		reply.send({ csrf_secret: request.csrfToken() });
	});

	fastify.post('/data', (request, reply) => {
		reply.send({ status: 'ok' });
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then((response) => {
			axios({
				url: 'http://localhost:'+ fastify.server.address().port+'/data',
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					"Content-Type": "application/x-www-form-urlencoded",
					'Cookie': `${ response.headers['set-cookie'][0] }`
				},
				data: qs.stringify({ "_csrf": response.data.csrf_secret }),
			})
			.then((response) => {
				t.equal(response.data.status, 'ok');
				t.end();
			})
			.catch((err) => {
				t.error(err, 'invalid csrf token');
				t.end();
			});

		})
		.catch((err) => {
			t.error(err);
			t.end()
		});
	});
});

test('csrf token authentication session based (defaults: memory store) _csrf_custom session token', (t) => {
	t.plan(2);
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifySession, { cookieName: '_ses', cookie: { path: '/',secure: false },  secret: 'a secret with minimum length of 32 characters' });
	fastify.register(fastifyFormBody);
	fastify.register(fastifyCsrf, { key: '_csrf_custom' });

	fastify.get('/', (request, reply) => {
		reply.send({ csrf_secret: request.csrfToken() });
	});

	fastify.post('/data', (request, reply) => {
		reply.send({ status: 'ok' });
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then((response) => {
			axios({
				url: 'http://localhost:'+ fastify.server.address().port+'/data',
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					"Content-Type": "application/x-www-form-urlencoded",
					'Cookie': `${ response.headers['set-cookie'][0] }`
				},
				data: qs.stringify({ "_csrf": response.data.csrf_secret }),
			})
			.then((response) => {
				t.equal(response.data.status, 'ok');
				t.end();
			})
			.catch((err) => {
				t.error(err, 'invalid csrf token');
				t.end();
			});

		})
		.catch((err) => {
			t.error(err);
			t.end()
		});
	});
});

test('csrf token authentication session based ignore method(POST)', (t) => {
	t.plan(2);
	const fastify = Fastify();
	fastify.register(fastifyCookie);
	fastify.register(fastifySession, { cookieName: '_ses', cookie: { path: '/',secure: false },  secret: 'a secret with minimum length of 32 characters' });
	fastify.register(fastifyFormBody);
	fastify.register(fastifyCsrf, { ignoreMethods: ['POST', 'GET'] });

	fastify.get('/', (request, reply) => {
		reply.send({ csrf_secret: request.csrfToken() });
	});

	fastify.post('/data', (request, reply) => {
		reply.send({ status: 'ok' });
	});

	fastify.listen(0, (err) => {
		fastify.server.unref();
		t.error(err);
		axios({
			method: 'get',
			url: 'http://localhost:'+ fastify.server.address().port +'/'
		})
		.then((response) => {
			axios({
				url: 'http://localhost:'+ fastify.server.address().port+'/data',
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					"Content-Type": "application/x-www-form-urlencoded",
					'Cookie': `${ response.headers['set-cookie'][0] }`
				},
			})
			.then((response) => {
				t.equal(response.data.status, 'ok');
				t.end();
			})
			.catch((err) => {
				t.error(err, 'invalid csrf token');
				t.end();
			});

		})
		.catch((err) => {
			t.error(err);
			t.end()
		});
	});
});
