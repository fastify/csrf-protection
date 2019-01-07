'use strict'

const fastifyPlugin = require('fastify-plugin');
var Cookie = require('cookie')
var CSRF = require('csrf');

function csrf(fastify, options, next) {
	fastify.addHook('preHandler', handleCsrf);
	fastify.decorateRequest('csrfToken', csrfToken);
	var opts = options || {};
	var cookie = getCookieOptions(opts.cookie);
	var sessionKey = options.sessionKey || 'session';
	var tokenIdentifier = options.value || defaultValue;
	var tokens = new CSRF(opts);
	var ignoreMethods = opts.ignoreMethods === undefined ? ['GET', 'HEAD', 'OPTIONS']: opts.ignoreMethods;

	if(!Array.isArray(ignoreMethods)) {
		throw new TypeError('ignoreMethods must be an array')
	}
	//debugger	
	function handleCsrf(request, reply, done) {
		var secret = getSecret(request, cookie);
	//	debugger
		// cookie for csrf token not set.
		if(!secret) {
			secret = tokens.secretSync();
			setSecret(request, reply, secret, cookie);
		}
		if(ignoreMethods.indexOf(request.req.method) < 0 && !tokens.verify(secret, tokenIdentifier(request))) {
			return done(new Error('invalid csrf token'));
		}
		done();
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
		var sec = getSecret(this, cookie);
		return tokens.create(sec);
	}

	function tokenContainer(request, cookie) {
		if(cookie || typeof cookie === 'object') {
			return request['cookies'];
		} 
	}

	function getSecret(request, cookie) {
		var container = tokenContainer(request, cookie);
		return container[cookie.key];
	}

	function setSecret(request, reply, secret, cookie) {
		var container = tokenContainer(request, cookie);
		container[cookie.key] = secret; 
		setCookie(reply, cookie.key, secret, cookie);
	}

	function setCookie(reply, key, value, cookie) {
		var data = Cookie.serialize(key, value, cookie);
		reply.header('set-cookie', data)
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