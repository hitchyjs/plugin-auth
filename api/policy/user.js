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
		self: ( req, res, next ) => {
			const { uuid, roles = [], name } = req.user || {};
			DebugLog( "user.self:", `user: { uuid: ${uuid}, roles: ${roles}, name: ${name} }` );
			let err;
			if ( ( uuid == null || uuid !== req.params.uuid ) && roles.indexOf( "admin" ) < 0 ) {
				res
					.status( 403 )
					.json( {
						error: "access forbidden",
					} );
			}
			next( err );
		},
		changePassword: ( req, res, next ) => {
			const current = req.user;
			return new Promise( resolve => {
				switch ( req.method ) {
					case "PATCH" :
					case "POST" : {
						return req.fetchBody().then( body => {
							resolve( {
								old1: body.old,
								old2: body.old2,
								newPw: body.new,
							} );
						} );
					}
					default : return {};
				}
			} )
				.then( ( { old1, old2, newPw } ) => {
					console.log( { old1, old2, newPw } );
					if ( !old1 ) {
						res
							.status( 403 )
							.json( {
								error: "access forbidden: old password missing",
							} );
						return next( "verification needed" );
					}
					if ( !newPw ) {
						res
							.status( 403 )
							.json( {
								error: "access forbidden: new password missing",
							} );
						return next( "verification needed" );
					}
					if ( !current ) {
						res
							.status( 403 )
							.json( {
								error: "access forbidden: verification needed",
							} );
						return next( "verification needed" );
					}

					if ( old2 && ( old1 !== old2 ) ) {
						res
							.status( 403 )
							.json( {
								error: "access forbidden: passwords do not match",
							} );
						return next( "passwords do not match" );
					}

					const { User } = api.runtime.models;
					const { uuid } = current;
					const user = new User( uuid );
					return user.load()
						.then( userRes => {
							const oldPassword = userRes.password;
							if ( !user.verifyPassword( old1, oldPassword ) ) {
								res
									.status( 403 )
									.json( {
										error: "access forbidden: wrong password",
									} );
								return next( "wrong password" );
							}

							return user.setPassword( newPw )
								.then( hashedPW => {
									console.log( "new", hashedPW );
									console.log( "old", oldPassword );
									user.save();
								} );
						} );
				} )
				.catch( err => {
					AlertLog( err );
					next( err );
				} );
		}
	};
};
