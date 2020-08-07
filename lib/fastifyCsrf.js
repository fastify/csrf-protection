'use strict'

const fastifyPlugin = require('fastify-plugin');
var CSRF = require('csrf');

const REPLY_KEY = Symbol('fastify-csrf:reply reference')

function csrf(fastify, options, next) {
	fastify.addHook('onRequest', (request, reply, done) => {
		// We need a reference to the reply on the current request so that we can access fastify-cookie's unsignCookie()
		// function exposed on the reply from our csrfToken() function we add to the request.
		request[REPLY_KEY] = reply;
		done();
	});
	fastify.addHook('preHandler', handleCsrf);
	fastify.decorateRequest('csrfToken', csrfToken);
	var opts = options || {};
	var cookie = getCookieOptions(opts.cookie);
	var sessionCsrfKey = options.key || '_csrf';
	var tokenIdentifier = options.value || defaultValue;
	var tokens = new CSRF(opts);
	var ignoreMethods = opts.ignoreMethods === undefined ? ['GET', 'HEAD', 'OPTIONS']: opts.ignoreMethods;

	if(!Array.isArray(ignoreMethods)) {
		throw new TypeError('ignoreMethods must be an array')
	}

	async function handleCsrf(request, reply) {
		var secret = getSecret(request, reply, cookie);
		// cookie for csrf token not set.
		if(!secret) {
			secret = await tokens.secret();
			setSecret(request, reply, secret, cookie);
		}
		if(ignoreMethods.indexOf(request.raw.method) < 0 && !tokens.verify(secret, tokenIdentifier(request))) {
			throw new Error('invalid csrf token');
		}
	}

	function defaultValue (req) {
	    return (req.body && req.body._csrf) ||
	    (req.query && req.query._csrf) ||
	    (req.headers['csrf-token']) ||
	    (req.headers['xsrf-token']) ||
	    (req.headers['x-csrf-token']) ||
	    (req.headers['x-xsrf-token'])
	}

	function getCookieOptions(opts) {
		if(opts !== true && typeof opts !== 'object') {
			return undefined;
		}
		var defaultCookieOptions = {
			key: '_csrf',
			path: '/'
		}

		if(opts && typeof opts === 'object') {
			for(var prop in opts) {
				var val = opts[prop];
				if(val !== undefined) {
					defaultCookieOptions[prop] = val;
				}
			}
		}
		return defaultCookieOptions;
	}

	function csrfToken() {
		var sec = getSecret(this, this[REPLY_KEY], cookie);
		return tokens.create(sec);
	}

	function isCookieContainer(cookie) {
		if(cookie || typeof cookie === 'object') {
			return true;
		}
		return false;
	}

	function tokenContainer(request, cookie) {
		if(isCookieContainer(cookie)) {
			return request['cookies'];
		} else {
			return request['session'];
		}
	}

	function getSecret(request, reply, cookie) {
		var container = tokenContainer(request, cookie);
		if(isCookieContainer(cookie)) {
			const cookieValue = container[cookie.key];
			if (cookie.signed && cookieValue && cookieValue.indexOf('.') > -1) {
				return reply.unsignCookie(cookieValue)
			} else {
				return cookieValue;
			}
		} else {
			return request.session[sessionCsrfKey];
		}
	}

	function setSecret(request, reply, secret, cookie) {
		var container = tokenContainer(request, cookie);
		if(isCookieContainer(cookie)) {
			container[cookie.key] = secret;
			setCookie(reply, cookie.key, secret, cookie);
		} else {
			request.session[sessionCsrfKey] = secret;
		}
	}

	function setCookie(reply, key, value, cookie) {
		reply.setCookie(key, value, cookie);
	}
	next();
}

module.exports = fastifyPlugin(csrf, {
    fastify: '>=1.0.0',
    name: 'fastify-csrf',
    dependencies: [
	    'fastify-cookie'
    ]
});
