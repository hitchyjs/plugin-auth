"use strict";

module.exports = function() {
	const api = this;

	return {
		auth: {
			strategies: {
				// local: api.runtime.services.AuthStrategies.generateLocal()
			},
		}
	};
};
