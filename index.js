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
			const { models: { User, AuthRule }, services: { AuthStrategies, AuthLibrary, Passport } } = api.runtime;
			const { rules, strategies } = api.config.auth || {};

			// initializing PassportJs
			Passport.serializeUser( ( user, done ) => {
				DebugLog( `serializeUser: { name: ${user.name}, role: ${user.role}, uuid: ${user.uuid} }` );
				return done( null, user.uuid );
			} );

			Passport.deserializeUser( ( uuid, done ) => {
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

			// handling declared Strategies from config.auth.strategies
			const declaredStrategies = strategies || {};
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
				Passport.use( AuthStrategies.generateLocal() );
			}

			const promises = [];

			// check if admin user exists if not create default admin
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

			// check if authRules exist if not use and save authRules declared in config.auth.rules
			promises.push(
				AuthRule.list( { loadProperties: true } )
					.then( entries => {
						if ( entries.length ) {
							DebugLog( `loading ${entries.length} authSpec${entries.length === 1 ? "" : "s"} from dataBase` );
							for ( const entry of entries ) {
								AuthLibrary.addAuthRule( entry );
							}
						} else {
							const declaredRules = rules || [];
							const normalizedRules = [];

							for ( const ruleSet of declaredRules ) {
								if ( typeof ruleSet === "object" ) {
									if ( !Array.isArray( ruleSet ) ) {
										const declaredRuleNames = Object.keys( ruleSet );
										for ( const name of declaredRuleNames ) {
											const rule = ruleSet[name];
											if ( rule != null ) {
												normalizedRules.push( Object.assign( {}, rule, { spec: name } ) );
											}
										}
									}
									if ( Array.isArray( ruleSet ) ) {
										for ( const rule of ruleSet ) {
											if ( rule.spec == null ) {
												AlertLog( "rule with missing spec detected", rule );
											} else {
												normalizedRules.push( rule );
											}
										}
									}
								}
							}

							if ( normalizedRules.length ) {
								const CreatingEntries = [];
								DebugLog( `loading ${normalizedRules.length} authSpec${normalizedRules.length === 1 ? "" : "s"} from config` );
								for ( const rule of normalizedRules ) {
									if ( rule != null ) {
										const authRule = new AuthRule();
										const keys = Object.keys( rule );
										for ( const key of keys ) {
											if ( rule[key] )authRule[key] = rule[key];
										}
										CreatingEntries.push( authRule.save().then( () => api.runtime.services.AuthLibrary.addAuthRule( authRule ) ) );
									}
								}
								return Promise.all( CreatingEntries );
							}
						}
						return undefined;
					} ).then( () => {
						DebugLog( `finished tree for AuthRuleLibrary:` );
						AuthLibrary.logAuthTree();
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
