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

const Should = require( "should" );
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

		after( "stopping hitchy", () => {
			return server ? HitchyDev.stop( server ) : undefined;
		} );
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
				authRule.authUUID = UUID;
				authRule.positive = true;
				authRule.role = `model.read`;
				return authRule.save()
					.then( () => AuthRule.list() )
					.then( items => items.length.should.eql( 1 ) );
			} );
		} );
		describe( "without exisiting spec", () => {
			it( `adding AuthRule`, () => {
				const { AuthRule, AuthSpec } = server.$hitchy.hitchy.runtime.models;
				const authRule = new AuthRule();
				authRule.spec = "model.read";
				authRule.positive = true;
				authRule.role = `model.read`;
				return authRule.save()
					.then( () => Promise.all( [ AuthSpec.list(), AuthRule.list() ] ) )
					.then( ( [ specs, rules ] ) => {
						specs.length.should.eql( 1 );
						rules.length.should.eql( 2 );
					} );

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
				for ( const propagates of [ undefined, true, false ] ) {
					describe( `with ${propagates == null ? "default behaviour" : propagates ? "propagation enabled" : "propagation disabled"}`, () => {
						it( `adding AuthSpec`, () => {
							const { AuthSpec } = server.$hitchy.hitchy.runtime.models;
							const authSpec = new AuthSpec();
							authSpec.spec = `${ruleType ? "positive" : "negative"}.${propagates}`;
							return authSpec.save().then( ( { uuid } ) => {
								authUUID = uuid;
								return AuthSpec.list().then( items => {
									items.length.should.eql( ++numRulesAndSpecs );
								} );
							} );
						} );

						it( `adding AuthRule`, () => {
							const { AuthRule } = server.$hitchy.hitchy.runtime.models;
							const authRule = new AuthRule();
							authRule.authUUID = authUUID;
							authRule.positive = ruleType;
							authRule.propagates = propagates;
							authRule.role = `${ruleType ? "positive" : "negative"}.${propagates}`;
							return authRule.save().then( () => {
								return AuthRule.list().then( items => {
									items.length.should.eql( numRulesAndSpecs );
								} );
							} );
						} );

						describe( `authorizes a user with role: ${ruleType ? "positive" : "negative"}.${propagates}`, () => {
							it( `${propagates && !ruleType ? "denies" : "allows"} acces to ${ruleType ? "positive" : "negative"}`, () => {
								const library = server.$hitchy.hitchy.runtime.services.AuthLibrary;
								const rule = ruleType ? "positive" : "negative";
								library.authorize( { roles: [`${rule}.${propagates}`] }, `${rule}` )
									.should.be.eql( !( propagates && !ruleType ) );
							} );

							it( `${ruleType ? "allows" : "denies"} acces to ${ruleType ? "positive" : "negative"}.${propagates}`, () => {
								const library = server.$hitchy.hitchy.runtime.services.AuthLibrary;
								const rule = ruleType ? "positive" : "negative";
								library.authorize( { roles: [`${rule}.${propagates}`] }, `${rule}.${propagates}` )
									.should.be.eql( ruleType );
							} );

						} );
					} );
				}
			} );
		}
	} );
} );
