"use strict";

module.exports = function() {
	return {
		auth: {
			// filterPassword: false,
			strategies: {
				// local: api.runtime.services.AuthStrategies.generateLocal()
			},
			rules: [
				// { spec: "user.write", positive: false } // only admin has access to user.write requests
			]
		}
	};
};
