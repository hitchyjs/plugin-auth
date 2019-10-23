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

const LocalStrategy = require( "passport-local" ).Strategy;

module.exports = function() {
	const api = this;

	const AlertLog = api.log( "hitchy:plugin:auth:alert" );
	const DebugLog = api.log( "hitchy:plugin:auth:debug" );

	return {
		generateLocal: () => {
			const strategy = new LocalStrategy( ( name, password, done ) => {
				api.runtime.models.User
					.find( { eq: { name: "name", value: name } }, {} ,{ loadRecords: true } )
					.then( matches => {
						switch ( matches.length ) {
							case 0 :
								return done( null, false, { message: "Incorrect username." } );

							case 1 : {
								const [user] = matches;
								DebugLog( `authStrategy: authenticated as: name: ${user.name}, role: ${user.role}, uuid: ${user.uuid}` );
								console.log( `authStrategy: user: { name: ${user.name}, uuid: ${user.uuid}, role: ${user.role} }` );
								if ( user.verifyPassword( password ) ) {
									return done( null, user );
								}

								return done( null, false, { message: "Incorrect password." } );
							}

							default :
								return done( null, false, { message: "Ambiguous username." } );
						}
					} )
					.catch( err => {
						AlertLog( err );
						done( err );
					} );
			} );
			strategy.passwordRequried = true;
			return strategy;
		},
		defaultStrategy: () => {
			const { defaultStrategy, strategies } = api.config.auth;
			if ( defaultStrategy ) {
				return defaultStrategy;
			}
			const strategiesNames = Object.keys( strategies );
			return strategiesNames.length === 1 ? strategiesNames[0] : "local";
		},
	};
};
