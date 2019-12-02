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

const crypto = require( "crypto" );

module.exports = function() {
	const api = this;

	return {
		props: {
			name: {
				required: true,
			},
			password: {
				type: "string",
			},
			role: {
				type: "string",
			},
			strategy: {},
			provider: {},
		},
		hooks: {
			afterValidate( errors ) {
				if ( !errors.length ) {
					const strategy = this.strategy || api.runtime.services.AuthStrategies.defaultStrategy();
					switch ( strategy ) {
						case "local" : {
							if ( this.password ) break;
						}
						// falls through
						default : {
							if ( !api.config.auth.strategies[strategy].passwordRequired || this.password ) {
								break;
							}
							errors.push( new TypeError( "password required" ) );
						}
					}
				}
				return errors;
			},
			beforeSave( existsAlready, record ) {
				if ( record.password )
					return this.hashPassword( record.password ).then( hashedPassword => {
						record.password = hashedPassword;
						return record;
					} );
				return Promise.resolve( record );
			}
		},
		computed: {
			roles() {
				return ( this.role || "" ).trim().split( /\s*,[,\s]*/ );
			},
		},
		methods: {
			/**
			 * Derives salted hash from provided password.
			 *
			 * @param {string} cleartext cleartext password to be hashed
			 * @param {Buffer|string} salt salt or previously derived hash consisting salt to be re-used
			 * @return {Promise<string>} promises derived hash
			 */
			hashPassword( cleartext, salt = null ) {
				if ( !cleartext ) {
					return Promise.reject( new TypeError( "missing cleartext password to be hashed" ) );
				}

				if ( cleartext.length === 120 &&
					/^[a-z0-9+/]{119}=$/i.test( cleartext ) &&
					Buffer.from( cleartext, "base64" ).slice( 0,9 ).toString() === "{SSHA512}" ) {
					return Promise.resolve( cleartext );
				}

				const hash = crypto.createHash( "sha512" );
				let promise;

				const _extracted = salt == null ? null : ( Buffer.isBuffer( salt ) ? salt : Buffer.from( salt, "base64" ) ).slice( 73 );

				if ( _extracted && _extracted.length >= 16 ) {
					promise = Promise.resolve( _extracted );
				} else {
					promise = new Promise( ( resolve, reject ) => crypto.randomBytes( 16, ( error, buffer ) => {
						if ( error ) {
							reject( error );
						} else {
							resolve( buffer );
						}
					} ) );
				}

				return promise
					.then( _salt => {

						hash.update( _salt );
						hash.update( Buffer.isBuffer( cleartext ) ? cleartext : Buffer.from( String( cleartext ), "utf8" ) );
						hash.update( _salt );

						return Buffer.concat( [ Buffer.from( "{SSHA512}" ), hash.digest(), _salt ] ).toString( "base64" );
					} );
			},

			/**
			 * Derives and saves salted hash from provided password.
			 * @param{string} password cleartext password to be hashed
			 * @return {Promise<string>} promises derived hash
			 */
			setPassword( password ) {
				return this.hashPassword( password ).then( hashedPassword => {
					this.password = hashedPassword;
					return hashedPassword;
				} );
			},

			/**
			 * Derives and compares salted hash from provided password with saved password.
			 * @param{string} password cleartext password to be hashed
			 * @return {Promise<boolean>} promises true if hashed password matches else false
			 */
			verifyPassword( password ) {
				return this.hashPassword( password, this.password ).then( hashedPassword => {
					return this.password === hashedPassword;
				} );
			}
		},
	};
};
