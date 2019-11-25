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

/* eslint-disable max-nested-callbacks */

"use strict";

const Path = require( "path" );

const HitchyDev = require( "hitchy-server-dev-tools" );
const freshUUID = () => require( "crypto" ).randomBytes( 16 ).toString( "hex" ).toLowerCase().replace( /^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5" );



require( "should-http" );

describe( "AuthRuleLibrary", () => {
	let server = null;

	describe( "AuthRule", () => {
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

		after( "stopping hitchy", () => ( server ? HitchyDev.stop( server ) : undefined ) );

		describe( "adding", () => {
			describe( "with exisiting spec", () => {
				let UUID;

				it( `adding AuthSpec`, () => {
					const { AuthSpec } = server.$hitchy.hitchy.runtime.models;
					const authSpec = new AuthSpec();
					authSpec.spec = `model.read`;
					return authSpec.save()
						.then( auth => {
							UUID = auth.uuid;
						} )
						.then( () => AuthSpec.list() )
						.then( entries => entries.length.should.be.eql( 1 ) );
				} );

				it( `adding AuthRule`, () => {
					const { AuthRule } = server.$hitchy.hitchy.runtime.models;
					const authRule = new AuthRule();
					authRule.authSpecUUID = UUID;
					authRule.positive = true;
					authRule.role = `model.read`;
					return authRule.save()
						.then( () => AuthRule.list() )
						.then( items => items.length.should.eql( 1 ) );
				} );

				it( `adding AuthRule without authSpecUUID`, () => {
					const { AuthRule, AuthSpec } = server.$hitchy.hitchy.runtime.models;
					const authRule = new AuthRule();
					authRule.spec = "model.read";
					authRule.positive = true;
					authRule.role = `model.read`;
					return authRule.save()
						.then( () => Promise.all( [ AuthSpec.list(), AuthRule.list() ] ) )
						.then( ( [ specs, rules ] ) => {
							specs.length.should.eql( 1 ); // number of AuthSpecs does not increase since the spec is already existing
							rules.length.should.eql( 2 );
						} );

				} );

			} );

			describe( "without exisiting spec", () => {
				it( `adding AuthRule`, () => {
					const { AuthRule, AuthSpec } = server.$hitchy.hitchy.runtime.models;
					const authRule = new AuthRule();
					authRule.spec = "model.write";
					authRule.positive = true;
					authRule.role = `model.write`;
					return authRule.save()
						.then( () => Promise.all( [ AuthSpec.list(), AuthRule.list() ] ) )
						.then( ( [ specs, rules ] ) => {
							specs.length.should.eql( 2 ); // number of AuthSpecs does not increase since the spec is already existing
							rules.length.should.eql( 3 );
						} );

				} );
			} );

			describe( "throws error when", () => {
				it( "authSpecUUID is not matching an existing authSpec" , () => {
					const authRule = new server.$hitchy.hitchy.runtime.models.AuthRule();
					authRule.positive = true;
					authRule.role = `model.read`;
					authRule.authSpecUUID = freshUUID();
					return authRule.save().should.be.rejected();
				} );

				it( "authSpecUUID and spec is missing" , () => {
					const authRule = new server.$hitchy.hitchy.runtime.models.AuthRule();
					authRule.positive = true;
					authRule.role = `model.read`;
					return authRule.save().should.be.rejected();
				} );

				it( "spec from authSpecUUID does not match spec", () => {
					return server.$hitchy.hitchy.runtime.models.AuthSpec.list( entries => {
						const authRule = new server.$hitchy.hitchy.runtime.models.AuthRule();
						authRule.positive = true;
						authRule.spec = "notTheRightSpec";
						authRule.authSpecUUID = entries[0].uuid;
						authRule.role = `model.read`;
						return authRule.save().should.be.rejected();
					} );
				} );

			} );
		} );

		describe( "removeAuthRule", () => {
			it( "exisiting entry", () => {
				const { AuthRule, AuthSpec } = server.$hitchy.hitchy.runtime.models;
				return AuthRule.list()
					.then( entries => entries[0] )
					.then( entry => {
						const authRule = new AuthRule( entry.uuid );
						return authRule.load();
					} ).then( authRule => {
						const { authSpecUUID } = authRule;
						const authSpec = new AuthSpec( authSpecUUID );
						return authSpec.load()
							.then( ( { spec } ) => {
								const AuthLibrary = server.$hitchy.hitchy.runtime.services.AuthLibrary;
								AuthLibrary.getNodePath( spec ).should.have.length( 3 );
								return authRule.remove()
									.then( () => {
										AuthLibrary.logAuthTree();
										AuthLibrary.getNodePath( spec ).should.have.length( 2 );
									} );
							} );

					} );
			} );
		} );

		describe( `changing an AuthRule`, () => {
			it( "with new spec", () => {
				const { AuthRule, AuthSpec } = server.$hitchy.hitchy.runtime.models;
				return AuthRule.list()
					.then( entries => entries[0] )
					.then( entry => {
						const authRule = new AuthRule( entry.uuid );
						return authRule.load();
					} ).then( authRule => {
						const { authSpecUUID } = authRule;
						const authSpec = new AuthSpec( authSpecUUID );
						return authSpec.load()
							.then( ( { spec } ) => {
								const AuthLibrary = server.$hitchy.hitchy.runtime.services.AuthLibrary;
								const length = AuthLibrary.listAuthRules( false ).length;
								authRule.spec = "model.move";
								authRule.authSpecUUID = "";
								return AuthSpec.list()
									.then( oldList => {
										const numSpec = oldList.length;
										return authRule.save()
											.then( () => {
												AuthLibrary.listAuthRules( false ).length.should.be.eql( length + 1 );
												AuthLibrary.getNodePath( spec ).should.have.length( 2 );
												return AuthSpec.list( list => list.length.should.be.eql( numSpec + 1 ) );
											} );
									} );

							} );
					} );
			} );

			it( "with now unused spec", () => {
				const { AuthRule, AuthSpec } = server.$hitchy.hitchy.runtime.models;
				return AuthRule.list()
					.then( entries => entries[0] )
					.then( entry => {
						const authRule = new AuthRule( entry.uuid );
						return authRule.load();
					} ).then( authRule => {
						const { authSpecUUID } = authRule;
						const authSpec = new AuthSpec( authSpecUUID );
						return authSpec.load()
							.then( ( { spec } ) => {
								const AuthLibrary = server.$hitchy.hitchy.runtime.services.AuthLibrary;
								const length = AuthLibrary.listAuthRules( false ).length;
								authRule.spec = "model.edit";
								authRule.authSpecUUID = "";
								return AuthSpec.list()
									.then( oldList => {
										const numSpec = oldList.length;
										return authRule.save()
											.then( () => {
												AuthLibrary.listAuthRules( false ).length.should.be.eql( length );
												AuthLibrary.getNodePath( spec ).should.have.length( 2 );
												return AuthSpec.list( list => list.length.should.be.eql( numSpec - 1 ) );
											} );
									} );

							} );
					} );
			} );
		} );

		describe( "loading AuthRules", () => {
			it( "loads AuthRules from fileAdapter on StartUp", () => {
				if ( server ) HitchyDev.stop( server );
				return HitchyDev.start( { pluginsFolder: Path.resolve( __dirname, "../../.." ),
					testProjectFolder: Path.resolve( __dirname, "../../project/basic" ),
					options: {
						// debug: true,
					}, } )
					.then( s => {
						server = s;
					} )
					.then( () => {
						const { AuthRule } = server.$hitchy.hitchy.runtime.models;
						return AuthRule.list;
					} )
					.then( list => list.length )
					.then( length => server.$hitchy.hitchy.runtime.services.AuthLibrary.listAuthRules( false ).length.should.eql( length ) );
			} );
		} );
	} );

	describe( "authorization", () => {
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

		let authUUID;
		let numRulesAndSpecs = 0;
		for ( const ruleType of [ true, false ] ) {
			describe( `${ruleType ? "positive" : "negative"} Rule`, () => {
				it( `adding AuthSpec with spec ${ruleType ? "positive" : "negative"}.user`, () => {
					const { AuthSpec } = server.$hitchy.hitchy.runtime.models;
					const authSpec = new AuthSpec();
					authSpec.spec = `${ruleType ? "positive" : "negative"}.user`;
					return authSpec.save().then( ( { uuid } ) => {
						authUUID = uuid;
						return AuthSpec.list().then( items => {
							items.length.should.eql( ++numRulesAndSpecs );
						} );
					} );
				} );

				it( `adding an AuthRule`, () => {
					const { AuthRule } = server.$hitchy.hitchy.runtime.models;
					const authRule = new AuthRule();
					authRule.authSpecUUID = authUUID;
					authRule.positive = ruleType;
					authRule.role = `${ruleType ? "positive" : "negative"}.user`;
					return authRule.save().then( () => {
						return AuthRule.list().then( items => {
							items.length.should.eql( numRulesAndSpecs );
						} );
					} );
				} );

				it( `${ruleType ? "allows" : "denies"} user with role: ${ruleType ? "positive" : "negative"}.user`, () => {
					const library = server.$hitchy.hitchy.runtime.services.AuthLibrary;
					const rule = ruleType ? "positive" : "negative";
					library.authorize( { roles: [`${rule}.user`] }, `${rule}.user` ).should.be.eql( ruleType );
				} );
			} );
		}
	} );

	describe( "listAuthRules" , () => {
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

		it( "adds authRules", () => {
			const promises = [];
			const { AuthRule } = server.$hitchy.hitchy.runtime.models;
			for ( const char of [ "a", "b", "c", "d", "e", "f", "g" ] )
				for ( const number of [ 0,1,2,3,4,5,6,7,8,9 ] ) {
					const authRule = new AuthRule();
					authRule.spec = `${char}.${number}`;
					authRule.role = `${char}.${number}`;
					authRule.positive = true;
					promises.push( authRule.save() );
				}
			return Promise.all( promises )
				.then( () => AuthRule.list() )
				.then( entries => entries.length.should.be.eql( 70 ) );
		} );

		it( "lists all authRules", () => {
			server.$hitchy.hitchy.runtime.services.AuthLibrary.logAuthTree();
			server.$hitchy.hitchy.runtime.services.AuthLibrary.listAuthRules().length.should.be.eql( 70 + 7 + 1 ); // 70 AuthRules, 7 nodes, 1 root
		} );
	} );
} );
