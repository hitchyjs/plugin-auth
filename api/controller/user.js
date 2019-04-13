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

let adminUser = null;

module.exports = function() {
	const api = this; // eslint-disable-line consistent-this

	return {
		auth( req, res ) {
			const { runtime: { models: { user: User } } } = api;

			if ( adminUser === null ) {
				adminUser = User.findByAttribute( "role", "admin", "eq", 0, 1 )
					.then( found => {
						if ( found && found.length > 0 ) {
							return found;
						}

						return hashPassword( "nimda" )
							.then( hash => {
								const user = new User();

								user.properties.name = "admin";
								user.properties.password = hash;
								user.properties.role = "admin";

								return user.save()
									.then( () => user );
							} );
					} );
			}

			Promise.all( [ req.fetchBody(), adminUser ] )
				.then( ( [body] ) => {
					return User.findByAttribute( "name", body.name, "eq", 0, 2 )
						.then( users => {
							if ( users && users.length === 1 ) {
								const user = users[0];

								return hashPassword( body.password, user.properties.password )
									.then( hash => {
										if ( hash.toString( "base64" ) === user.properties.password ) {
											return ( req.session.user = {
												uuid: user.uuid,
												name: user.properties.name,
												roles: [user.properties.role],
											} );
										}

										return null;
									} );
							}

							return null;
						} );
				} )
				.then( authenticatedUser => {
					if ( authenticatedUser ) {
						res
							.status( 200 )
							.json( Object.assign( {
								success: true,
							}, authenticatedUser ) );
					} else {
						res
							.status( 403 )
							.json( {
								error: "authentication failed",
							} );
					}
				} )
				.catch( error => {
					res
						.status( 500 )
						.json( {
							message: error.message,
						} );
				} );
		},

		getCurrent( req, res ) {
			res
				.status( 200 )
				.json( {
					success: true,
					authenticated: ( req.session && req.session.user ) || false,
				} );
		},

		dropAuth( req, res ) {
			if ( req.session && req.user ) {
				req.session.drop();
			}

			res.status( 200 ).json( {
				success: true,
			} );
		},
	};
};

/**
 * Derives salted hash from provided password.
 *
 * @param {string} cleartext cleartext password to be hashed
 * @param {string} salt salt or previously derived hash consisting salt to be re-used
 * @return {Promise<string>} promises derived hash
 */
function hashPassword( cleartext, salt = null ) {
	if ( !cleartext ) {
		return Promise.reject( new TypeError( "missing cleartext password to be hashed" ) );
	}

	const crypto = require( "crypto" );
	const hash = crypto.createHash( "sha512" );
	let promise;

	const _extracted = salt == null ? null : ( Buffer.isBuffer( salt ) ? salt : Buffer.from( salt, "base64" ) ).slice( 64 );

	if ( _extracted && _extracted.length > 0 ) {
		promise = Promise.resolve( _extracted );
	} else {
		promise = new Promise( ( resolve, reject ) => crypto.randomBytes( 16, ( error, buffer ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( buffer );
			}
		} ) );
	}

	return promise
		.then( _salt => {

			hash.update( _salt );
			hash.update( Buffer.isBuffer( cleartext ) ? cleartext : Buffer.from( String( cleartext ), "utf8" ) );
			hash.update( _salt );

			return Buffer.concat( [ hash.digest(), _salt ] ).toString( "base64" );
		} );
}
