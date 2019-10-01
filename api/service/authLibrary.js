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

module.exports = function( options, pluginHandles, myHandle ) {
	const api = this;
	const cache = {};
	const { Auth } = api.runtime.models;

	return {
		addAuthz( Authz ) {
			const { authUUID, role, userUUID, positive } = Authz;
			return Auth.list( { eq: { name: "uuid", value: authUUID } } )
				.then( entries => {
					const { spec } = entries[0];
					let pointer = cache;

					if ( spec ) {
						const parts = spec.split( "." );
						for ( const part of parts ) {
							if ( !pointer.children ) {
								pointer.children = {};
							}
							if ( !pointer.children[part] ) {
								pointer.children[part] = {};
							}
							pointer = pointer.children[part];
						}
					}

					if ( !pointer.values ) {
						pointer.values = {};
					}

					const values = pointer.values;
					const list = positive ? "pos" : "neg";

					if ( role != null ) {
						if ( values.role[list] ) {
							values.role[list].push( role );
						} else {
							values.role[list] = [role];
						}
					}
					if ( userUUID != null ) {
						if ( values.userUUID[list] ) {
							values.userUUID[list].push( userUUID );
						} else {
							values.userUUID[list] = [userUUID];
						}
					}
				} );
		},
		listAuthz( authSpec ) {
			let pointer = cache;

			if ( authSpec ) {
				const parts = authSpec.split( "." );
				for ( const part of parts ) {
					pointer = pointer.children[part];
				}
			}

			return pointer.values || [];
		},
		authorize( { uuid, roles }, authSpec ) {
			let pointer = cache;
			const prioritisePositiveRules = api.config.auth.prioritisePositiveRules;

			if ( authSpec ) {
				const parts = authSpec.split( "." );
				for ( const part of parts ) {
					pointer = pointer.children[part];
				}
			}


			const { values } = pointer;

			/**
			 * checks if the rules have an authz
			 * @param {{roles:[], userUUID: []}} rules set of rules for roles and userUUID
			 * @return {boolean} if rule contains authz
			 */
			function checkRules( rules ) {
				if ( rules ) {
					if ( roles ) {
						for ( const role of roles ) {
							if ( rules.roles && rules.roles.indexOf( role ) ) {
								return true;
							}
						}
					}
					if ( uuid ) {
						if ( rules.userUUID && rules.userUUID.indexOf( uuid ) ) {
							return true;
						}
					}
				}
				return false;
			}

			if ( prioritisePositiveRules ) {
				if ( checkRules( values.pos ) ) return true;
				if ( checkRules( values.neg ) ) return false;
			} else {
				if ( checkRules( values.neg ) ) return false;
				if ( checkRules( values.pos ) ) return true;
			}

			return true;
		}
	};
};
