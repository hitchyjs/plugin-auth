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

module.exports = function( options, plugins ) {
	const api = this;
	const AlertLog = api.log( "hitchy:plugin:auth:alert" );
	const DebugLog = api.log( "hitchy:plugin:auth:debug" );

	if ( Object.keys( plugins ).some( name => plugins[name].role === "odm-provider" ) ) {
		// application is using hitchy-plugin-odem-rest or some related drop-in
		// -> assure to be processed before that
		myApi.$meta.dependants = ["odm-provider"];
	}

	const myApi = {
		initialize() {
			const { models: { User, AuthRule }, services: { AuthStrategies } } = api.runtime;
			const config = api.config.auth || {};

			api.runtime.services.Passport.serializeUser( ( user, done ) => {
				DebugLog( `serializeUser: { name: ${user.name}, role: ${user.role}, uuid: ${user.uuid} }` );
				return done( null, user.uuid );
			} );

			api.runtime.services.Passport.deserializeUser( ( uuid, done ) => {
				const user = new User( uuid );
				return user.$exists
					.then( exists => {
						if ( exists ) return user.load();
						throw new Error( "user uuid does not exist" );
					} )
					.then( loadedUser => {
						DebugLog( `deserializeUser: name: ${loadedUser.name}, role: ${loadedUser.role}, uuid: ${loadedUser.uuid}` );
						done( null, loadedUser );
					} )
					.catch( done );
			} );

			const declaredStrategies = config.strategies || {};
			const declaredStrategyNames = Object.keys( declaredStrategies );
			if ( declaredStrategyNames.length ) {
				for ( const declaredStrategy of declaredStrategyNames ) {
					const strategy = declaredStrategies[declaredStrategy];
					if ( strategy != null ) {
						try {
							api.runtime.services.Passport.use( strategy );
						} catch ( e ) {
							AlertLog( "strategy not compatible with passport.use:", declaredStrategy, e );
						}
					}
				}
			} else if ( !( declaredStrategies.local || declaredStrategies["passport-local"] ) ) {
				api.runtime.services.Passport.use( AuthStrategies.generateLocal() );
			}

			const promises = [];

			promises.push(
				User.find( { eq: { name: "role", value: "admin" }, } )
					.then( matches => {
						if ( matches && matches.length > 0 ) {
							DebugLog( "admin user found" );
							return matches;
						}

						DebugLog( "creating admin user" );

						const user = new User();

						user.name = "admin";
						user.role = "admin";

						return user.setPassword( "nimda" )
							.then( () => user.save() )
							.then( () => User.list().then( ( [admin] ) => DebugLog( "created admin with uuid: " + admin.uuid ) ) );
					} )
					.catch( err => {
						console.error( err );
						AlertLog( err );
					} )
			);

			promises.push(
				AuthRule.list( { loadProperties: true } )
					.then( entries => {
						DebugLog( `loading ${entries.length} authSpec${entries.length === 1 ? "" : "s"} into the AuthLibrary` );
						for ( const entry of entries ) {
							api.runtime.services.AuthLibrary.addAuthRule( entry );
						}
						DebugLog( `finished tree for AuthRuleLibrary:` );
						api.runtime.services.AuthLibrary.logAuthTree();
					} )
			);

			return Promise.all( promises );
		},

		policies: {
			"/": "Auth.initialize",
			"POST /api/auth/login": ["Auth.authenticate"],
			"GET /api/auth/login": ["Auth.authenticate"],
			"GET /api/auth/logout": ["Auth.dropAuth"],
			"POST /api/auth/password": ["user.changePassword"],
			"PATCH /api/auth/password": ["user.changePassword"],
		},

		routes: {
			"POST /api/auth/login": "user.auth",
			"GET /api/auth/login": "user.auth",
			"GET /api/auth/current": "user.getCurrent",
			"GET /api/auth/logout": "user.dropAuth",
			"POST /api/auth/password": ["user.changePassword"],
			"PATCH /api/auth/password": ["user.changePassword"],
		},
	};

	return myApi;
};
