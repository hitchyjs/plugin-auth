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

const Passport = require( "passport" );

exports.initialize = ( req, res, next ) => {
	Passport.initialize()( req, res, err => {
		if ( err ) {
			next( err );
		} else {
			Passport.session()( req, res, err => {
				if ( req.session.user ) {
					const { name, roles } = req.session.user;

					res.set( "X-Authenticated-As", name );
					res.set( "X-Authorized-As", roles.join( "," ) );
				}
				next( err );
			} );
		}
	} );
};

exports.authenticate = ( req, res, next ) => {
	const { strategy } = req.params;
	const { config } = req.hitchy;
	const { defaultStrategy } = config.auth || {};

	req.fetchBody().then( body => {
		req.body = body;
		Passport.authenticate( strategy || defaultStrategy || "local" )( req, res, err => {
			if ( req.user ) {
				const { uuid, name, roles } = req.user;

				req.session.user = { uuid, name, roles };
				res.set( "X-Authenticated-As", name );
				res.set( "X-Authorized-As", roles.join( "," ) );
			} else {
				req.session.user = null;
			}
			next( err );
		} );
	} ).catch( next );
};

exports.requireAuthentication = ( req, res, next ) => {
	if ( req.user ) {
		next();
	} else {
		res
			.status( 403 )
			.json( {
				error: "access forbidden",
			} );
	}
};

exports.requireAdmin = ( req, res, next ) => {
	if ( !req.user || req.user.roles.indexOf( "admin" ) < 0 ) {
		res
			.status( 403 )
			.json( {
				error: "access forbidden",
			} );
	} else {
		next();
	}
};
