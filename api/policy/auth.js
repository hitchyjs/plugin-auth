/**
 * (c) 2019 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

"use strict";

module.exports = function() {
	const api = this;
	const AlertLog = api.log( "hitchy:plugin:auth:alert" );
	const DebugLog = api.log( "hitchy:plugin:auth:debug" );

	return {
		initialize: ( req, res, next ) => {
			api.runtime.services.Passport.initialize()( req, res, initializeError => {
				if ( initializeError ) {
					next( initializeError );
				} else {
					api.runtime.services.Passport.session()( req, res, sessionError => {
						if ( req.session.user ) {
							const { name, roles } = req.session.user;

							res.set( "X-Authenticated-As", name );
							res.set( "X-Authorized-As", roles.join( "," ) );
						}
						next( sessionError );
					} );
				}
			} );
		},
		authenticate: ( req, res, next ) => {
			const { strategy } = req.params;
			const { services } = req.hitchy.runtime;
			const defaultStrategy = services.AuthStrategies.defaultStrategy();

			req.fetchBody().then( body => {
				req.body = body;
				api.runtime.services.Passport.authenticate( strategy || defaultStrategy )( req, res, err => {
					if ( req.user ) {
						const { uuid, name, roles } = req.user;
						DebugLog( "authenticating: ", { uuid, name, roles, session: req.session.user } );

						req.session.user = { uuid, name, roles };
						res.set( "X-Authenticated-As", name );
						res.set( "X-Authorized-As", roles.join( "," ) );
					} else {
						req.session.drop();
					}
					if ( err ) AlertLog( err );
					next( err );
				} );
			} ).catch( err => {
				AlertLog( err );
				next( err );
			} );
		},
		dropAuth: ( req, res, next ) => {
			if ( req.session && req.session.user ) {
				try {
					req.session.drop();
					req.logout();
					res.set( "X-Authenticated-As", undefined );
					res.set( "X-Authorized-As", undefined );
				} catch ( e ) {
					next( e );
				}
			}
			next();
		},
		requireAuthentication: ( req, res, next ) => {
			if ( req.user ) {
				next();
			} else {
				res
					.status( 403 )
					.json( {
						error: "access forbidden",
					} );
			}
		},
		requireAuthorization: ( req, res, next ) => {
			const { url } = req;

			if ( req.user ) {
				next();
			} else {
				res
					.status( 403 )
					.json( {
						error: "access forbidden",
					} );
			}
		},
		requireAdmin: ( req, res, next ) => {
			if ( !req.user || req.user.roles.indexOf( "admin" ) < 0 ) {
				res
					.status( 403 )
					.json( {
						error: "access forbidden",
					} );
			} else {
				next();
			}
		}
	};
};

