"use strict";

const LocalStrategy = require( "passport-local" ).Strategy;

module.exports = function( options ) {
	const api = this;
	const { runtime: { models: { User } } } = api;

	 return {
		stategies: {
			local: new LocalStrategy(
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
		}
	 };
};
