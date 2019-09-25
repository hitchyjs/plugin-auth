"use strict";

const LocalStrategy = require( "passport-local" ).Strategy;

module.exports = function() {
	const api = this;

	return {
		strategies: {
			local: new LocalStrategy( ( name, password, done ) => {
				api.runtime.models.User
					.find( { eq: { name: "name", value: name } }, {} ,{ loadRecords: true } )
					.then( matches => {
						switch ( matches.length ) {
							case 0 :
								return done( null, false, { message: "Incorrect username." } );

							case 1 : {
								const user = matches[0];

								if ( user.verifyPassword( password ) ) {
									return done( null, user );
								}

								return done( null, false, { message: "Incorrect password." } );
							}

							default :
								return done( null, false, { message: "Ambiguous username." } );
						}
					} )
					.catch( done );
			} ),
		},
	};
};
