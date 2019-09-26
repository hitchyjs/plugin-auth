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
const { OAuthStrategy } = require( "passport-oauth" );

module.exports = function() {
	const api = this;
	const { User } = api.runtime.models;

	return {
		auth: {
			strategies: {
				oauth: new OAuthStrategy( {
					requestTokenURL: "http://term.ie/oauth/example/request_token.php",
					accessTokenURL: "http://term.ie/oauth/example/access_token.php",
					userAuthorizationURL: "http://term.ie/oauth/example/echo_api.php",
					consumerKey: "key",
					consumerSecret: "secret",
					callbackURL: "http://127.0.0.1:3000/api/auth/login",
					signatureMethod: "RSA-SHA1"
				},
				function( token, tokenSecret, profile, cb ) {
					console.log( "oauth callback", profile );
					return User.find( { eq: { name: "uuid", value: profile.uuid } }, {} ,{ loadRecords: true } ).then( user => {
						return cb( undefined, user[0] );
					} ).catch( err => {
						return cb( err, undefined );
					} );
				}
				)
			},
			defaultStrategy: "oauth",
		}
	};
};
