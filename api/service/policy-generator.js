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
	return {
		hasRole( roles ) {
			if ( !roles ) {
				throw new Error( "no Roles provided for hasRole PolicyGenerator" );
			}
			let parsedRoles = {};
			if ( Array.isArray( roles ) ) {
				for ( const role of roles ) {
					parsedRoles[role] = true;
				}
			} else if ( roles instanceof Object ) {
				parsedRoles = roles;
			} else {
				parsedRoles[roles] = true;
			}
			return ( req, res, next ) => {
				if ( req.user ) {
					let authorized = false;
					for ( const role of req.user.roles ) {
						if ( parsedRoles[role] || role === "admin" ) authorized = true;
					}
					if ( authorized ) {
						next();
						return;
					}
				}
				res
					.status( 403 )
					.json( {
						error: "access forbidden",
					} );
			};
		},
		hasAuthorization( authSpecs ) {
			if ( !authSpecs ) {
				throw new Error( "no authSpecs provided for hasAuthorization PolicyGenerator" );
			}
			let _authSpecs = authSpecs;
			if ( !Array.isArray( _authSpecs ) ) {
				_authSpecs = [_authSpecs];
			}
			return function( req, res, next ) {
				if ( req.user ) {
					let authorized = false;
					for ( const authSpec of _authSpecs ) {
						if ( this.services.AuthLibrary.authorize( req.user, authSpec ) || req.user.roles.indexOf( "admin" ) >= 0 ) authorized = true;
					}
					if ( authorized ) {
						next();
						return;
					}
				}
				res
					.status( 403 )
					.json( {
						error: "access forbidden",
					} );
			};
		}
	};
};
