/* Magic Mirror
 * Node Helper: MMM-MTA-NextBus
 *
 * By 
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

	// Override socketNotificationReceived method.

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		
		if (notification === "CONFIG") {
			self.config = payload;
			self.getData();

			setInterval(function() {
				self.getData();
			}, self.config.updateInterval);
		} else if (notification === "GET_DATA") {
			self.getData();
		}
	},

	

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	/*scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},*/

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: async function() {
		var self = this;
		var responses = []
		try {
			for (var busStopCode of self.config.busStopCodes) {
				var urlApi = "http://bustime.mta.info/api/siri/stop-monitoring.json?key=" +
					self.config.apiKey + "&version=2&OperatorRef=MTA&MonitoringRef=" +
					busStopCode;

				const response = await fetch(urlApi)
				const schedule = await response.json()
				responses.push(schedule)
			}
			self.sendSocketNotification("DATA", responses);
		} catch {
			self.sendSocketNotification("ERROR", this.status);
			console.log(self.name, this.status);
		}
	}
});
