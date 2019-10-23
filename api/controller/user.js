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
	return {
		changePassword( req, res ) {
			res.format( {
				default() {
					res.json( {
						success: true
					} );
				}
			} );
		},

		auth( req, res ) {
			res.format( {
				default() {
					res.json( {
						success: true,
						authenticated: Boolean( req.user ),
					} );
				}
			} );
		},

		getCurrent( req, res ) {
			res
				.status( 200 )
				.json( {
					success: true,
					authenticated: req.user ? {
						uuid: req.user.uuid,
						name: req.user.name,
						roles: req.user.roles,
					} : false,
				} );
		},

		dropAuth( req, res ) {
			res.status( 200 ).json( {
				success: true,
			} );
		},
	};
};

