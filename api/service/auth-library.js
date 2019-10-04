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
	const { models } = api.runtime;

	return {
		addAuthRule( { authUUID, role, userUUID, positive, propagates } ) {
			const updateNodesOnPath = propagates == null ? Boolean( positive ) : propagates;
			return new models.AuthSpec( authUUID ).load()
				.then( ( { spec } ) => {
					const list = positive ? "pos" : "neg";

					let pointer = cache;

					/**
					 * @param {{values: {role: [], userUUID: []}}} _pointer pointer to nodes with values to fill roles and userUUIDs into
					 * @return {void}
 					 */
					function fillValues( _pointer ) {
						if ( !_pointer.values ) {
							_pointer.values = {};
						}
						const values = _pointer.values;
						if ( role != null ) {
							if ( !values.role ) values.role = {};
							if ( values.role[list] && values.role[list].indexOf( role ) < 0 ) {
								values.role[list].push( role );
							} else {
								values.role[list] = [role];
							}
						}
						if ( userUUID != null ) {
							if ( !values.userUUID ) values.userUUID = {};
							if ( values.userUUID[list] && values.userUUID[list].indexOf( userUUID ) < 0 ) {
								values.userUUID[list].push( userUUID );
							} else {
								values.userUUID[list] = [userUUID];
							}
						}
					}

					if ( spec ) {
						const parts = spec.split( "." );
						const numParts = parts.length;
						for ( let index = 0; index < numParts; index++ ) {
							const part = parts[index];
							if ( !pointer.children ) {
								pointer.children = {};
							}
							if ( !pointer.children[part] ) {
								pointer.children[part] = {};
							}
							pointer = pointer.children[part];

							if ( updateNodesOnPath || index === numParts - 1 ) fillValues( pointer );
						}
					} else {
						fillValues( pointer );
					}
				} );
		},
		removeAuthRule( { authUUID, role, userUUID, positive, propagates } ) {
			const updateNodesOnPath = propagates == null ? Boolean( positive ) : propagates;
			return new models.AuthSpec( authUUID ).load()
				.then( entry => entry.spec )
				.then( spec => {
					let pointer = cache;
					const list = positive ? "pos" : "neg";

					/**
					 * @param {{values: {role: [], userUUID: []}}} _pointer pointer to nodes with values to fill roles and userUUIDs into
					 * @return {void}
					 */
					function removeValues( _pointer ) {
						if ( !_pointer.values ) {
							_pointer.values = {};
						}
						const values = _pointer.values;
						if ( role != null && values.role[list] ) {
							const index = values.role[list].indexOf( role );
							if ( index > -1 ) {
								values.role[list].splice( index, 1 );
							}
						}
						if ( userUUID != null && values.userUUID[list] ) {
							const index = values.userUUID[list].indexOf( userUUID );
							if ( index > -1 ) {
								values.userUUID[list].splice( index, 1 );
							}
						}
					}

					if ( spec ) {
						const parts = spec.split( "." );
						const numParts = parts.length;
						for ( let index = 0; index < numParts; index++ ) {
							const part = parts[index];
							if ( !pointer.children ) {
								pointer.children = {};
							}
							if ( !pointer.children[part] ) {
								pointer.children[part] = {};
							}
							pointer = pointer.children[part];

							if ( updateNodesOnPath || index === numParts - 1 ) removeValues( pointer );
						}
					} else {
						removeValues( pointer );
					}
				} );
		},
		listAuthRules( authSpec ) {
			let pointer = cache;

			if ( authSpec ) {
				const parts = authSpec.split( "." );
				for ( const part of parts ) {
					pointer = pointer.children[part];
				}
			}

			return pointer.values || {};
		},
		authorize( { uuid, roles }, authSpec ) {
			let pointer = cache;

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
			 * @param {string} set "neg" or "pos" corresponding to neg and pos rules
			 * @return {boolean} if rule contains authz
			 */
			function checkRules( rules, set ) {
				if ( rules ) {
					if ( roles ) {
						for ( const role of roles ) {
							if ( rules.role[set] && rules.role[set].indexOf( role ) > -1 ) {
								return true;
							}
						}
					}
					if ( uuid ) {
						if ( rules.userUUID[set] && rules.userUUID[set].indexOf( uuid ) > -1 ) {
							return true;
						}
					}
				}
				return false;
			}

			if ( api.config.auth.prioritisePositiveRules ) {
				if ( checkRules( values, "pos" ) ) return true;
				if ( checkRules( values, "neg" ) ) return false;
			} else {
				if ( checkRules( values, "neg" ) ) return false;
				if ( checkRules( values, "pos" ) ) return true;
			}

			return true;
		}
	};
};
