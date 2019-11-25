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

describe( "Hitchy authorization", function() {
	let server = null;
	let sid = null;
	this.timeout( 30000 );

	before( "starting hitchy", function() {
		return HitchyDev.start( {
			pluginsFolder: Path.resolve( __dirname, "../.." ),
			testProjectFolder: Path.resolve( __dirname, "../project/basic" ),
			options: {
				// debug: true,
			},
		} )
			.then( s => {
				server = s;
			} );
	} );

	after( "stopping hitchy", () => {
		if ( server ) {
			return HitchyDev.stop( server );
		}
		return undefined;
	} );

	it( "is running", () => {
		return HitchyDev.query.get( "/api/user" )
			.then( res => {
				res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();
				sid = getSID( res.headers );
				sid.should.be.ok();

				res.should.have.status( 403 );
			} );
	} );

	it( "provides information on missing user authentication", () => {
		return HitchyDev.query.get( "/api/auth/current", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.should.be.Object().which.has.properties( "success", "authenticated" );
				res.data.success.should.be.true();
				res.data.authenticated.should.be.false();
			} );
	} );

	it( "denies access to routes used to change user related data", () => {
		const { User } = server.$hitchy.hitchy.runtime.models;
		return User.list()
			.then( list => list[0] )
			.then( admin => admin.uuid )
			.then( uuid =>
				Promise.all( [
					HitchyDev.query.get( "/api/user/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 403 );
							res.data.error.should.be.startWith( "access forbidden" );
						} ),
					HitchyDev.query.get( "/api/user/write/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 403 );
							res.data.error.should.be.startWith( "access forbidden" );
						} ),
					HitchyDev.query.get( "/api/user/replace/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 403 );
							res.data.error.should.be.startWith( "access forbidden" );
						} ),
					HitchyDev.query.put( "/api/user/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 403 );
							res.data.error.should.be.startWith( "access forbidden" );
						} ),
					HitchyDev.query.patch( "/api/user/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 403 );
							res.data.error.should.be.startWith( "access forbidden" );
						} ),
				] ) );
	} );

	it( "allows access to routes used to change user related data if logged in as admin", () => {
		const { User } = server.$hitchy.hitchy.runtime.models;
		return HitchyDev.query.post( "/api/auth/login", "username=admin&password=nimda", {
			cookie: `sessionId=${sid}`,
			"Content-Type": "application/x-www-form-urlencoded",
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.success.should.be.true();
			} )
			.then( () => User.list() )
			.then( list => list[0] )
			.then( admin => {
				const { uuid } = admin;
				return Promise.all( [
					HitchyDev.query.get( "/api/user/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 200 );
						} ),
					HitchyDev.query.get( "/api/user/write/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 200 );
						} ),
					HitchyDev.query.get( "/api/user/replace/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 200 );
						} ),
					HitchyDev.query.put( "/api/user/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 200 );
						} ),
					HitchyDev.query.patch( "/api/user/" + uuid, null, { cookie: `sessionId=${sid}`, } )
						.then( res => {
							res.should.have.status( 200 );
						} ),
				] );
			} );
	} );

} );
