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

const Path = require( "path" );

const HitchyDev = require( "hitchy-server-dev-tools" );

require( "should" );
require( "should-http" );


describe( "AuthLibrary", () => {
	let server = null;

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

	after( "stopping hitchy", () => {
		return server ? HitchyDev.stop( server ) : undefined;
	} );

	describe( "Authz", () => {
		let authUUID;
		it( "preparing Auth", () => {

			const { Auth } = server.$hitchy.hitchy.runtime.models;
			const auth = new Auth();
			auth.spec = "user.read";
			return auth.save().then( ( { uuid } ) => {
				console.log( uuid );
				authUUID = uuid;
				return Auth.list().then( items => {
					items.length.should.eql( 1 );
				} );
			} );
		} );

		it( "adding Authz", () => {
			const { Authz } = server.$hitchy.hitchy.runtime.models;
			const authz = new Authz();
			authz.authUUID = authUUID;
			authz.positive = false;
			authz.role = "user";
			return authz.save().then( () => {
				return Authz.list().then( items => {
					items.length.should.eql( 1 );
				} );
			} );
		} );

		it( "has registered authz in library", () => {
			const library = server.$hitchy.hitchy.runtime.services.AuthLibrary;
			library.listAuthz( "user" ).role.neg[0].should.be.eql( "user" );
			library.listAuthz( "user.read" ).role.neg[0].should.be.eql( "user" );
		} );

		it( "does authorization correct", () => {
			const library = server.$hitchy.hitchy.runtime.services.AuthLibrary;
			library.authorize( { roles: ["user"] }, "user.read" ).should.be.false();
		} );
	} );
} );
