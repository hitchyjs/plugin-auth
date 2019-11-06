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


describe( "Hitchy instance with plugin for server-side user authentication and authorization", () => {
	let server = null;
	let sid = null;

	before( "starting hitchy", () => {
		return HitchyDev.start( {
			pluginsFolder: Path.resolve( __dirname, "../.." ),
			files: {
				"config/routes.js": `"use strict";

exports.routes = {
\t"GET /api/user": function( req, res ) {
\t\treturn res.json( {
\t\t\tsuccess: true,
\t\t} );
\t},
};
`
			},
			options: {
				debug: true,
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
				res.should.have.status( 403 );

				res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();

				sid = getSID( res.headers );
				sid.should.be.ok();
			} );
	} );

	it( "supports authentication of default user using POSTed form data", () => {
		return HitchyDev.query.post( "/api/auth/login", "username=admin&password=nimda", {
			cookie: `sessionId=${sid}`,
			"Content-Type": "application/x-www-form-urlencoded",
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.success.should.be.true();
			} );
	} );

	it( "provides information on previously authenticated user due to tracking user in server-side session", () => {
		return HitchyDev.query.get( "/api/auth/current", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.should.be.Object().which.has.properties( "success", "authenticated" );
				res.data.success.should.be.true();
				res.data.authenticated.should.not.be.false();
			} );
	} );

	it( "changes password of current user with POST request", () => {
		return HitchyDev.query.post( "/api/auth/password", {
			old: "nimda",
			new: "NiMdA"
		}, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.should.be.Object().which.has.properties( "success" );
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

	it( "does not provide information on previously authenticated and now dropped user anymore though requesting in context of proper session again", () => {
		return HitchyDev.query.get( "/api/auth/current", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();

				const newSID = getSID( res.headers );
				newSID.should.be.ok().and.not.equal( sid );
				sid = newSID;

				res.data.should.be.Object().which.has.properties( "success", "authenticated" );
				res.data.success.should.be.true();
				res.data.authenticated.should.be.false();
			} );
	} );

	it( "rejects access on REST API endpoint /api/user due to lack of authentication", () => {
		return HitchyDev.query.get( "/api/user", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 403 );
			} );
	} );

	it( "does supports authentication of default user using POSTed JSON data with new Password", () => {
		return HitchyDev.query.post( "/api/auth/login", JSON.stringify( { username: "admin", password: "NiMdA" } ), {
			cookie: `sessionId=${sid}`,
			"Content-Type": "application/json",
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.success.should.be.true();
			} );
	} );

	it( "provides information on previously authenticated user due to tracking user in server-side session", () => {
		return HitchyDev.query.get( "/api/auth/current", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.should.be.Object().which.has.properties( "success", "authenticated" );
				res.data.success.should.be.true();
				res.data.authenticated.should.not.be.false();
			} );
	} );

	it( "grants access on REST API endpoint /api/user due to previous authentication as administrative user", () => {
		return HitchyDev.query.get( "/api/user", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.should.be.Object().which.has.property( "success" ).which.is.true();
			} );
	} );

	let uuid;

	it( "creates an new user using a REST API endpoint due to previous authentication as administrative user", () => {
		return HitchyDev.query.post( "/api/user", {
			name: "Test",
			password: "test",
			role: "user"
		}, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 201 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.should.be.Object().which.has.property( "uuid" );
				uuid = res.data.uuid;
				return server.$hitchy.hitchy.runtime.models.User.list().then( list => list.length.should.be.eql( 2 ) );
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

	it( "does not provide information on previously authenticated and now dropped user anymore though requesting in context of proper session again", () => {
		return HitchyDev.query.get( "/api/auth/current", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.have.property( "set-cookie" ).which.is.an.Array().which.is.not.empty();

				const newSID = getSID( res.headers );
				newSID.should.be.ok().and.not.equal( sid );
				sid = newSID;

				res.data.should.be.Object().which.has.properties( "success", "authenticated" );
				res.data.success.should.be.true();
				res.data.authenticated.should.be.false();
			} );
	} );

	it( "supports authentication as a user using POSTed form data", () => {
		return HitchyDev.query.post( "/api/auth/login", "username=Test&password=test", {
			cookie: `sessionId=${sid}`,
			"Content-Type": "application/x-www-form-urlencoded",
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.success.should.be.true();
			} );
	} );

	it( "provides information on previously authenticated user due to tracking user in server-side session", () => {
		return HitchyDev.query.get( "/api/auth/current", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
				res.headers.should.not.have.property( "set-cookie" );
				res.data.should.be.Object().which.has.properties( "success", "authenticated" );
				res.data.success.should.be.true();
				res.data.authenticated.should.not.be.false();
			} );
	} );

	it( "rejects access on REST API endpoint /api/user due to lack of authorization", () => {
		return HitchyDev.query.get( "/api/user", null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 403 );
			} );
	} );

	it( "allows access on REST API endpoint /api/user/:uuid when uuid is own uuid", () => {
		return HitchyDev.query.get( "/api/user/" + uuid, null, {
			cookie: `sessionId=${sid}`,
		} )
			.then( res => {
				res.should.have.status( 200 );
			} );
	} );
} );
