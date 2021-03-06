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
	const { services, models } = api.runtime;

	return {
		props: {
			authSpecUUID: { type: "uuid" },
			spec: { type: "string" },
			role: { type: "string" },
			userUUID: { type: "uuid" },
			positive: { type: "boolean" }
		},
		hooks: {
			afterValidate( errors ) {
				const auth = new models.AuthSpec( this.authSpecUUID );
				return Promise.all( [
					auth.$exists,
					this.userUUID ? new models.User( this.userUUID ).$exists : undefined,
				] ).then( ( [ exists, userExists ] ) => {
					const promises = [];
					if ( !exists ) {
						if ( this.spec ) {
							const { AuthSpec } = api.runtime.models;
							promises.push(
								AuthSpec.find( { eq: { name: "spec", value: this.spec } } )
									.then( ( [entry] ) => {
										if ( entry ) {
											this.authSpecUUID = entry.uuid;
											return undefined;
										}
										const authSpec = new AuthSpec();
										authSpec.spec = this.spec;
										return authSpec.save()
											.then( res => {
												this.authSpecUUID = res.uuid;
											} );
									} ) );
						} else {
							errors.push( new TypeError( "unknown authSpecUUID and no spec, please supply spec or matching authSpecUUID" ) );
						}
					} else if ( this.spec != null ) {
						promises.push( auth.load()
							.then( entry => {
								if ( entry.spec !== this.spec ) {
									errors.push( new Error( "authSpecUUID does not match the provided spec" ) );
								}
							} )
						);
					}
					if ( userExists != null && !userExists ) errors.push( new TypeError( "unknown userUUID" ) );
					return Promise.all( promises ).then( () => errors );
				} );
			},
			afterSave( existsAlready ) {
				const monitorContext = this.$properties.$context;
				const promises = [];
				if ( existsAlready && monitorContext.hasChanged ) {
					const { changed } = monitorContext;
					const authSpecUUIDChanged = changed.has( "authSpecUUID" );
					promises.push( services.AuthLibrary.removeAuthRule( {
						authSpecUUID: authSpecUUIDChanged ? changed.get( "authSpecUUID" ) : this.authSpecUUID,
						role: changed.has( "role" ) ? changed.get( "role" ) : this.role,
						userUUID: changed.has( "userUUID" ) ? changed.get( "userUUID" ) : this.userUUID,
						positive: changed.has( "positive" ) ? changed.get( "positive" ) : this.positive
					} ) );
					if ( authSpecUUIDChanged ) {
						const { AuthRule } = api.runtime.models;
						const uuid = changed.get( "authSpecUUID" );
						promises.push(
							AuthRule.find( { eq: { name: "authSpecUUID", value: uuid } } )
								.then( list => {
									if ( !list.length ) {
										const { AuthSpec } = api.runtime.models;
										const authSpec = new AuthSpec( uuid );
										return authSpec.remove();
									}
									return undefined;
								} )
						);
					}
				}
				return Promise.all( promises )
					.then( () => services.AuthLibrary.addAuthRule( this ) );
			},
			afterRemove() {
				return services.AuthLibrary.removeAuthRule( this );
			}
		}

	};
};
