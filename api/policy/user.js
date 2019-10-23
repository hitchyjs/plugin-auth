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
			const old1 = req.params.old1;
			const old2 = req.params.old2;
			const newPw = req.params.new;

			const current = req.session.user;

			if ( !current ) {
				return next( "verification needed" );
			}

			if ( old1 !== old2 ) {
				return next( "passwords do not match" );
			}

			const User = api.models.User;
			const { uuid } = current;
			const { load, setPassword, save } = new User( uuid );
			return load()
				.then( userRes => {
					if ( !User.verifyPassword( old1, userRes.password ) ) {
						return next( "wrong passwords" );
					}

					return setPassword( newPw )
						.then( () => save() );

				} )
				.catch( err => {
					AlertLog( err );
					next( err );
				} );
		}
	};
};
