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
	const cache = {};
	const { models } = api.runtime;
	const DebugLog = api.log( "hitchy:plugin:auth:debug" );

	return {
		addAuthRule( { authSpecUUID, role, userUUID, positive } ) {
			DebugLog( "adding ", { authSpecUUID, role, userUUID, positive }," to AuthLibrary" );
			return new models.AuthSpec( authSpecUUID ).load()
				.then( authSpec => {
					const _spec = authSpec.spec;
					const list = positive ? "pos" : "neg";

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

					fillValues( this.findNode( _spec ) );
					this.logAuthTree();
				} );
		},
		removeAuthRule( { authSpecUUID, role, userUUID, positive } ) {
			const that = this;
			return new models.AuthSpec( authSpecUUID ).load()
				.then( ( { spec } ) => {
					const list = positive ? "pos" : "neg";

					/**
					 * @param {{values: {role: {pos: [], neg:[]}, userUUID: {pos: [], neg:[]}}}} node pointer to nodes with values to fill roles, userUUIDs into
					 * @return {void}
					 */
					function removeValues( node ) {
						const values = node.values || {};
						if ( role != null && values.role && values.role[list] ) {
							const _role = values.role;
							const index = _role[list].indexOf( role );
							if ( index > -1 ) {
								_role[list].splice( index, 1 );
							}
							if ( !( _role.pos && _role.pos.length ) && !( _role.neg && _role.neg.length ) ) {
								values.role = false;
							}
							if ( !( _role.pos && _role.pos.length ) && ( _role.neg && _role.neg.length ) ) {
								values.role = { neg: _role.neg };
							}
							if ( ( _role.pos && _role.pos.length ) && !( _role.neg && _role.neg.length ) ) {
								values.role = { pos: _role.pos };
							}
						}
						if ( userUUID != null && values.userUUID && values.userUUID[list] ) {
							const _userUUID = values.userUUID;
							const index = _userUUID[list].indexOf( userUUID );
							if ( index > -1 ) {
								values.userUUID[list].splice( index, 1 );
							}
							if ( !( _userUUID.pos && _userUUID.pos.length ) && !( _userUUID.neg && _userUUID.neg.length ) ) {
								values.role = false;
							}
							if ( !( _userUUID.pos && _userUUID.pos.length ) && _userUUID.neg.length ) {
								values.role = { neg: _userUUID.neg };
							}
							if ( _userUUID.pos.length && !( _userUUID.neg && _userUUID.neg.length ) ) {
								values.role = { pos: _userUUID.pos };
							}
						}
						if ( !values.role && !values.userUUID ) {
							node.values = false;
							that.clearNode( spec );
						}
						if ( !values.role && values.userUUID ) {
							node.values = { userUUID: values.userUUID };
						}
						if ( values.role && !values.userUUID ) {
							node.values = { role: values.role };
						}
					}

					removeValues( this.findNode( spec ) );
				} );
		},
		clearNode( spec, pointer = cache ) {
			const parts = spec.split( "." );
			const nextPart = parts[0];
			let removeChild = false;
			if ( nextPart ) {
				if ( pointer.children[nextPart] )
					removeChild = this.clearNode( parts.slice( 1, Infinity ).join( "." ), pointer.children[nextPart] || null );
			}
			if ( removeChild ) {
				const keys = Object.keys( pointer.children );
				const oldChildren = pointer.children;
				pointer.children = {};
				for ( const key of keys ) {
					if ( key !== nextPart ) {
						pointer.children[key] = oldChildren[key];
					}
				}
			}
			return ( !pointer.children || Object.keys( pointer.children ).length === 0 ) && !pointer.values;
		},
		findNode( spec ) {
			let pointer = cache;
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

				}
			}
			return pointer;
		},
		logAuthTree() {
			const rules = this.listAuthRules();
			for ( const { spec, values, children } of rules ) {
				const indentation = spec ? spec.split( "." ).length : 0;
				DebugLog( "".padEnd( indentation, "-" ) + "* ", spec, values == null ? "" : values, Object.keys( children ).length ? Object.keys( children ) : "" );
			}
		},
		listAuthRules( listEmptyNodes = true ) {
			const nodeList = [];

			/**
			 * recursively adds all nodes to a List
			 * @param {{values: [], children: {} }} node node of the intern cache Tree
			 * @param {string} subString spec of the current node, corresponding to its position in the tree
			 * @returns {[{spec: string, values: [], children:[] }]} Nodes as a List
			 */
			function addNodeToList( node, subString ) {
				const children = node.children || {};
				if ( listEmptyNodes ? true : node.values ) nodeList.push( { spec: subString, values: node.values, children } );
				const childrenNames = Object.keys( children );
				for ( const childrenName of childrenNames ) {
					addNodeToList( children[childrenName], `${subString ? subString + "." : subString}${childrenName}` );
				}
			}
			addNodeToList( cache, "" );
			return nodeList;
		},
		getNodePath( spec ) {
			let pointer = cache;
			const rules = pointer.values ? [pointer.values] : [];

			if ( spec ) {
				const parts = spec.split( "." );
				for ( const part of parts ) {
					if ( pointer.children && pointer.children[part] ) {
						pointer = pointer.children[part];
						rules.push( pointer.values );
					} else {
						break;
					}
				}
			}

			return rules;
		},
		findAuthRules( authSpec ) {
			const rules = this.getNodePath( authSpec );

			const numRules = rules.length;
			const preparedAuthRules = {};
			for ( let i = numRules - 1; i > -1; i-- ) {
				const rule = rules[i];
				if ( rule ) {
					const { role, uuid } = rule;
					if ( role ) {
						const { pos, neg } = role;
						if ( !preparedAuthRules.role ) preparedAuthRules.role = [];
						if ( pos ) {
							if ( !preparedAuthRules.role.pos ) preparedAuthRules.role.pos = [];
							preparedAuthRules.role.pos = preparedAuthRules.role.pos.concat( pos );
						}
						if ( neg ) {
							if ( !preparedAuthRules.role.neg ) preparedAuthRules.role.neg = [];
							preparedAuthRules.role.neg = preparedAuthRules.role.neg.concat( neg );
						}
					}
					if ( uuid ) {
						if ( !preparedAuthRules.uuid ) preparedAuthRules.uuid = [];
						preparedAuthRules.uuid.concat( uuid );
					}
					break;
				}
			}
			return preparedAuthRules;
		},
		authorize( { uuid, roles }, authSpec ) {
			const authRules = this.findAuthRules( authSpec );

			/**
			 * checks if the rules have an authRule
			 * @param {{roles:[], userUUID: []}} rules set of rules for roles and userUUID
			 * @param {string} set "neg" or "pos" corresponding to neg and pos rules
			 * @return {boolean} if rule contains authz
			 */
			function checkRules( rules, set ) {
				if ( rules ) {
					if ( roles ) {
						for ( const role of roles ) {
							if ( rules.role && rules.role[set] && rules.role[set].indexOf( role ) > -1 ) {
								return true;
							}
						}
					}
					if ( uuid ) {
						if ( rules.userUUID && rules.userUUID[set] && rules.userUUID[set].indexOf( uuid ) > -1 ) {
							return true;
						}
					}
				}
				return false;
			}

			const prioritisePositiveRules = api.config.auth.prioritisePositiveRules || false;
			if ( prioritisePositiveRules ) {
				if ( checkRules( authRules, "pos" ) ) return true;
				if ( checkRules( authRules, "neg" ) ) return false;
			} else {
				if ( checkRules( authRules, "neg" ) ) return false;
				if ( checkRules( authRules, "pos" ) ) return true;
			}

			return prioritisePositiveRules;
		}
	};
};
