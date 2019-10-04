"use strict";

module.exports = function() {
	const api = this;

	return {
		auth: {
			strategies: {
				// local: api.runtime.services.AuthStrategies.generateLocal()
			},
			rules: [
				// { spec: "user.write", positive: false ) // only admin has access to user.write requests
			]
		}
	};
};
