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

/* eslint-disable max-nested-callbacks */

"use strict";

const Path = require( "path" );

const HitchyDev = require( "hitchy-server-dev-tools" );
const freshUUID = () => require( "crypto" ).randomBytes( 16 ).toString( "hex" ).toLowerCase().replace( /^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5" );

require( "should" );
require( "should-http" );

describe( "the user model", () => {
	let server;
	before( "starting hitchy", () => {
		return HitchyDev.start( { pluginsFolder: Path.resolve( __dirname, "../../.." ),
			testProjectFolder: Path.resolve( __dirname, "../../project/basic" ),
			options: {
				// debug: true,
			}, } )
			.then( s => {
				server = s;
			} );
	} );

	after( "stopping hitchy", () => ( server ? HitchyDev.stop( server ) : undefined ) );


	it( "is available", () => {
		server.$hitchy.hitchy.runtime.models.User.should.not.be.undefined();
	} );

	it( "can be can be constructed", () => {
		( () => new server.$hitchy.hitchy.runtime.models.User() ).should.not.throw();
	} );

	describe( "provides the function hashPassword that", () => {
		it( "exists", () => {
			const hashPassword = new server.$hitchy.hitchy.runtime.models.User().hashPassword;
			hashPassword.should.be.a.Function();
			hashPassword.should.have.length( 1 );
		} );
		it( "rejects if cleartext is missing", () => {
			return new server.$hitchy.hitchy.runtime.models.User().hashPassword().should.be.rejected();
		} );
		it( "can hash a password", () => {
			return new server.$hitchy.hitchy.runtime.models.User().hashPassword( "nimda" )
				.then( hashedPW => {
					hashedPW.length.should.be.eql( 120 );
					/^[a-z0-9+/]{119}=$/i.test( hashedPW ).should.be.true();
					( Buffer.from( hashedPW, "base64" ).slice( 0,9 ).toString() === "{SSHA512}" ).should.be.true();
				} );
		} );
		it( "returns clearText if clearText is already hashed", () => {
			const hashPassword = new server.$hitchy.hitchy.runtime.models.User().hashPassword;
			return hashPassword( "nimda" )
				.then( hashedPW => {
					return hashPassword( hashedPW )
						.then( hashedPW2 => {
							hashedPW2.should.be.eql( hashedPW );
						} );
				} );
		} );
		it( "returns different hashed values for the same value", () => {
			const hashPassword = new server.$hitchy.hitchy.runtime.models.User().hashPassword;
			return hashPassword( "nimda" )
				.then( hashedPW => {
					return hashPassword( "nimda" )
						.then( hashedPW2 => {
							hashedPW2.should.not.be.eql( hashedPW );
						} );
				} );
		} );
		it( "can hash a password using the salt from another password", () => {
			const hashPassword = new server.$hitchy.hitchy.runtime.models.User().hashPassword;
			return hashPassword( "nimda" )
				.then( hashedPW => {
					return Promise.all( [
						hashPassword( "nimda", hashedPW )
							.then( hashedPW2 => {
								hashedPW2.should.be.eql( hashedPW );
							} ),
						hashPassword( "NiMdA", hashedPW )
							.then( hashedPW2 => {
								hashedPW2.should.not.be.eql( hashedPW );
							} ),
						hashPassword( "whatever" )
							.then( anotherSalt => {
								return hashPassword( "nimda", anotherSalt )
									.then( hashedPW2 => {
										hashedPW2.should.not.be.eql( hashedPW );
									} );
							} )
					] );
				} );
		} );
	} );

	describe( "provides the function setPassword that", () => {
		it( "exists", () => {
			const setPassword = new server.$hitchy.hitchy.runtime.models.User().setPassword;
			setPassword.should.be.a.Function();
			setPassword.should.have.length( 1 );
		} );

		it( "saves the password hashed", () => {
			const user = new server.$hitchy.hitchy.runtime.models.User();
			return user.setPassword( "nimda" )
				.then( password => {
					user.password.should.be.eql( password );
					return user.hashPassword( "nimda", password );
				} )
				.then( password => {
					user.password.should.be.eql( password );
				} );
		} );
	} );

	describe( "provides the function verifyPassword that", () => {
		it( "exists", () => {
			const verifyPassword = new server.$hitchy.hitchy.runtime.models.User().verifyPassword;
			verifyPassword.should.be.a.Function();
			verifyPassword.should.have.length( 1 );
		} );

		it( "can verify a password given as clearText", () => {
			const user = new server.$hitchy.hitchy.runtime.models.User();
			return user.setPassword( "nimda" )
				.then( password => {
					user.password.should.be.eql( password );
					return user.verifyPassword( "nimda" );
				} )
				.then( result => {
					result.should.be.true();
					return user.verifyPassword( "Nimda" );
				} )
				.then( result => {
					result.should.be.false();
					return user.verifyPassword( "NiMdA" );
				} )
				.then( result => {
					result.should.be.false();
				} );
		} );
	} );
} );
