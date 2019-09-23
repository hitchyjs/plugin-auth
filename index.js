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

const Path = require( "path" );
const passport = require( "passport" );
const LocalStrategy = require( "passport-local" ).Strategy;

module.exports = {
	initialize( options, myHandle ) {
		const api = this;
		const AlertLog = api.log( "hitchy:plugin:auth:alert" );
		const DebugLog = api.log( "hitchy:plugin:auth:debug" );

		const config = api.config.auth || {};
		const declaredStrategies = config.strategies || {};
		const declaredStrategyNames = Object.keys( declaredStrategies );

		const { runtime: { models: { User } } } = api;

		passport.serializeUser( function( user, done ) {
			done( null, user );
		} );

		if ( declaredStrategyNames.length ) {
			const folder = options.projectFolder;
			let info;
			try {
				info = require( Path.resolve( folder, "package.json" ) );
			} catch ( e ) {
				info = {};
			}
			const { dependencies = {} } = info;

			const pattern = /^passport-/;
			const providedStrategies = Object.keys( dependencies ).filter( dependency => pattern.test( dependency ) );

			for ( let declaredStrategy of declaredStrategyNames ) {
				if ( !pattern.test( declaredStrategy ) ) {
					declaredStrategy = `passport-${declaredStrategy}`;
				}
				if ( providedStrategies.indexOf( declaredStrategy ) < 0 ) {
					AlertLog( "strategy is declared but not found in the dependencies of your hitchy project:", declaredStrategy );
				}
				const strategy = declaredStrategies[declaredStrategy];
				if ( declaredStrategy !== null )
					try {
						passport.use( strategy );
					} catch ( e ) {
						AlertLog( "strategy not compatible with passport.use:", declaredStrategy, e );
					}
			}
		} else if ( !( declaredStrategies.local || declaredStrategies["passport-local"] ) ) {
			passport.use( new LocalStrategy(
				function( name, password, done ) {
					User.find( { eq: { name: "name", value: name } }, {} ,{ loadRecords: true } ).then( matches => {
						if ( !matches ) {
							return done( null, false, { message: "Incorrect username." } );
						}
						for ( const user of matches ) {
							if ( user.verifyPassword( password ) ) {
								return done( null, user );
							}
						}
						return done( null, false, { message: "Incorrect password." } );
					} ).catch( err => {
						return done( err );
					} );
				} )
			);
		}

		User.find( { eq: { name: "role", value: "admin" }, } )
			.then( matches => {
				if ( matches && matches.length > 0 ) {
					return matches;
				}

				const user = new User();

				user.name = "admin";
				user.role = "admin";
				return user.setPassword( "nimda" )
					.then( () => user.save() )
					.then( () => user );
			} )
			.catch( err => {
				AlertLog( err );
			} );
	}
};

