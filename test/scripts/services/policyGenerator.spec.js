/**
 * (c) 2018 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 cepharum GmbH
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

const HitchyDev = require( "hitchy-server-dev-tools" );

const Path = require( "path" );

require( "should" );
require( "should-http" );

/**
 * Extracts session ID proposed in provided set of response headers.
 *
 * @param {object<string,(string|string[])>} headers set of response headers
 * @return {?string} found session ID, null if missing session ID
 */
function getSID( headers ) {
	let found = null;

	( headers["set-cookie"] || [] )
		.some( cookie => {
			const match = /^sessionId=\s*([^;]+)/.exec( cookie );
			if ( match ) {
				found = match[1];
			}

			return Boolean( match );
		} );

	return found;
}

describe( "policy-generator", () => {
	describe( "is a service for hitchy", () => {
		describe( "that is dicovered", () => {
			let server;

			before( function() {
				return HitchyDev.start( {
					useTmpPath: true,
					pluginsFolder: Path.resolve( __dirname, "../../../" ),
					options: {
						// debug: true,
					}
				} ).then( s => {
					server = s;
				} );
			} );

			after( "stopping hitchy", () => ( server ? HitchyDev.stop( server ) : undefined ) );

			it( "should be available as service", () => {
				server.$hitchy.hitchy.runtime.services.should.have.property( "PolicyGenerator" );
			} );

			it( "provides generators for hasRole and hasAuthorization", () => {
				const { PolicyGenerator } = server.$hitchy.hitchy.runtime.services;
				PolicyGenerator.should.have.property( "hasRole" );
				PolicyGenerator.should.have.property( "hasAuthorization" );
			} );
		} );

		describe( "hasRole", () => {
			let server, sid;
			before( function() {
				return HitchyDev.start( {
					files: {
						"config/routes.js": `
							"use strict"
							
							module.exports = function () {
								const api = this;
								
								return {
									routes: {
										"/developer": function( req, res ) {
											return res.json( {
												success: true,
											} );
										},
									},
								};
							}
						`,"config/policies.js": `
							"use strict"
							
							module.exports = function () {
								const api = this;
								
								return {
									policies: {
										"/developer": api.runtime.services.PolicyGenerator.hasRole("developer")
									},
								};
							}
						`,
					},
					pluginsFolder: Path.resolve( __dirname, "../../../" ),
					options: {
						// debug: true
					}
				} ).then( s => {
					server = s;
					const user = new server.$hitchy.hitchy.runtime.models.User();
					user.name = "developer";
					user.role = "developer";
					user.password = "developer";
					return user.save();
				} ).then( () => {
					const user = new server.$hitchy.hitchy.runtime.models.User();
					user.name = "nonDeveloper";
					user.role = "nonDeveloper";
					user.password = "nonDeveloper";
					return user.save();
				} );
			} );

			after( "stopping hitchy", () => ( server ? HitchyDev.stop( server ) : undefined ) );

			it( "blocks requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer" )
					.then( res => {
						res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();
						sid = getSID( res.headers );

						res.should.have.status( 403 );
					} );
			} );

			it( "allows login as developer", () => {
				return HitchyDev.query.post( "/api/auth/login", "username=developer&password=developer", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );

			it( "allows requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer", "", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );

			it( "drops information on previously authenticated user on demand", () => {
				return HitchyDev.query.get( "/api/auth/logout", null, {
					cookie: `sessionId=${sid}`,
				} )
					.then( res => {
						res.should.have.status( 200 );
						res.headers.should.not.have.property( "set-cookie" );
					} );
			} );

			it( "blocks requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer" )
					.then( res => {
						res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();
						sid = getSID( res.headers );

						res.should.have.status( 403 );
					} );
			} );

			it( "allows login as nonDeveloper", () => {
				return HitchyDev.query.post( "/api/auth/login", "username=nonDeveloper&password=nonDeveloper", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );

			it( "block requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer", "", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 403 );
					res.headers.should.not.have.property( "set-cookie" );
				} );
			} );

			it( "drops information on previously authenticated user on demand", () => {
				return HitchyDev.query.get( "/api/auth/logout", null, {
					cookie: `sessionId=${sid}`,
				} )
					.then( res => {
						res.should.have.status( 200 );
						res.headers.should.not.have.property( "set-cookie" );
					} );
			} );

			it( "blocks requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer" )
					.then( res => {
						res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();
						sid = getSID( res.headers );

						res.should.have.status( 403 );
					} );
			} );

			it( "allows login as admin", () => {
				return HitchyDev.query.post( "/api/auth/login", "username=admin&password=nimda", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );

			it( "allows requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer", "", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );
		} );

		describe( "hasAuthorization", () => {
			let server, sid;
			before( function() {
				return HitchyDev.start( {
					files: {
						"config/auth.js": `
							"use strict"
							
							module.exports = {
								auth: {
									rules: {
										"developer.read": {
											role: "developer",
											positive: true,
										},
										"developer": {
											positive: false,
										}
									}
								}
							}
						`,
						"config/routes.js": `
							"use strict"
							
							module.exports = function () {
								const api = this;
								
								return {
									routes: {
										"/developer": function( req, res ) {
											return res.json( {
												success: true,
											} );
										},
									},
								};
							}
						`,"config/policies.js": `
							"use strict"
							
							module.exports = function () {
								const api = this;
								
								return {
									policies: {
										"/developer": api.runtime.services.PolicyGenerator.hasAuthorization("developer.read")
									},
								};
							}
						`,
					},
					pluginsFolder: Path.resolve( __dirname, "../../../" ),
					options: {
						// debug: true
					}
				} ).then( s => {
					server = s;
					const user = new server.$hitchy.hitchy.runtime.models.User();
					user.name = "developer";
					user.role = "developer";
					user.password = "developer";
					return user.save();
				} ).then( () => {
					const user = new server.$hitchy.hitchy.runtime.models.User();
					user.name = "nonDeveloper";
					user.role = "nonDeveloper";
					user.password = "nonDeveloper";
					return user.save();
				} );
			} );

			after( "stopping hitchy", () => ( server ? HitchyDev.stop( server ) : undefined ) );

			it( "blocks requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer" )
					.then( res => {
						res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();
						sid = getSID( res.headers );

						res.should.have.status( 403 );
					} );
			} );

			it( "allows login as developer", () => {
				return HitchyDev.query.post( "/api/auth/login", "username=developer&password=developer", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );

			it( "allows requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer", "", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );

			it( "drops information on previously authenticated user on demand", () => {
				return HitchyDev.query.get( "/api/auth/logout", null, {
					cookie: `sessionId=${sid}`,
				} )
					.then( res => {
						res.should.have.status( 200 );
						res.headers.should.not.have.property( "set-cookie" );
					} );
			} );

			it( "blocks requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer" )
					.then( res => {
						res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();
						sid = getSID( res.headers );

						res.should.have.status( 403 );
					} );
			} );

			it( "allows login as nonDeveloper", () => {
				return HitchyDev.query.post( "/api/auth/login", "username=nonDeveloper&password=nonDeveloper", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );

			it( "block requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer", "", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 403 );
					res.headers.should.not.have.property( "set-cookie" );
				} );
			} );

			it( "drops information on previously authenticated user on demand", () => {
				return HitchyDev.query.get( "/api/auth/logout", null, {
					cookie: `sessionId=${sid}`,
				} )
					.then( res => {
						res.should.have.status( 200 );
						res.headers.should.not.have.property( "set-cookie" );
					} );
			} );

			it( "blocks requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer" )
					.then( res => {
						res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();
						sid = getSID( res.headers );

						res.should.have.status( 403 );
					} );
			} );

			it( "allows login as admin", () => {
				return HitchyDev.query.post( "/api/auth/login", "username=admin&password=nimda", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );

			it( "allows requests on the route with an hasRole policy", () => {
				return HitchyDev.query.get( "/developer", "", {
					cookie: `sessionId=${sid}`,
					"Content-Type": "application/x-www-form-urlencoded",
				} ).then( res => {
					res.should.have.status( 200 );
					res.headers.should.not.have.property( "set-cookie" );
					res.data.success.should.be.true();
				} );
			} );
		} );
	} );
} );
