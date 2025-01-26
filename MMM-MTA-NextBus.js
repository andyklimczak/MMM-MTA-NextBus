/* global Module */

/* Magic Mirror
 * Module: MMM-MTA-NextBus
 *
 * By 
 * MIT Licensed.
 */

Module.register("MMM-MTA-NextBus", {
	defaults: {
		timeFormat: config.timeFormat,
		maxEntries: 5,
		updateInterval: 60000,
		retryDelay: 5000,
		busStopCodes: [],
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		//this.loaded = false;
		console.log(this.config.timeFormat);
		this.sendSocketNotification("CONFIG", this.config);

		// Schedule update timer.
		setInterval(function() {
			self.sendSocketNotification("GET_DATA");
		}, this.config.updateInterval);
		
	},	

	getDom: function() {
		var self = this;

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");
		// If this.dataRequest is not empty
		if (this.dataRequest) {
			this.dataRequest.forEach(function(data, i) {
				var wrapperDataRequest = document.createElement("div");
				
				wrapperDataRequest.innerHTML = data;
				wrapperDataRequest.className = "small";
	
				wrapper.appendChild(wrapperDataRequest);
			});

			
		}
		
		return wrapper;
	},

	getScripts: function() {
		return ["moment.js"];
	},

	getStyles: function () {
		return [
			"MMM-MTA-NextBus.css",
		];
	},

	processData: function(data) {
		var self = this;
		this.dataRequest = self.processActionNextBus(data);
		self.updateDom(self.config.animationSpeed);
		//if (this.loaded === false) {  ; }
		//this.loaded = true;

		// the data if load
		// send notification to helper
		//this.sendSocketNotification("MMM-MTA-NextBus-NOTIFICATION_TEST", data);
	},

	processActionNextBus: function(responses) {
		var result = [];
		let journeys = []
		const updateTimestampReference = new Date()
		for (var response of responses) {
			var serviceDelivery = response.Siri.ServiceDelivery;

			var monitoringDeliveries = serviceDelivery.StopMonitoringDelivery
			for (var monitoringDelivery of monitoringDeliveries) {
				var visits = monitoringDelivery?.MonitoredStopVisit ?? [];

				for (var visit of visits) {
					journeys.push(visit.MonitoredVehicleJourney)
				}
			}
		}

		journeys.sort((a, b) => {
			return new Date(a.MonitoredCall.ExpectedArrivalTime) - new Date(b.MonitoredCall.ExpectedArrivalTime)
		})

		journeys = journeys.slice(0, Math.min(journeys.length, this.config.maxEntries))

		for (var journey of journeys) {
			r = '';

			var line = journey.PublishedLineName[0];

			var destinationName = journey.DestinationName[0];
			if (destinationName.startsWith('LIMITED')) {
				line += ' LIMITED';
			}

			r += line + ', ';

			var monitoredCall = journey.MonitoredCall;
			var mins = this.getArrivalEstimateForDateString(monitoredCall.ExpectedArrivalTime, updateTimestampReference);
			r += mins + ', ';

			var distance = monitoredCall.ArrivalProximityText;
			r += distance;

			result.push(r);
		}

		result.push('Last Updated: ' + this.formatTimeString(updateTimestampReference));

		return result;
	},

	getArrivalEstimateForDateString: function(dateString, refDate) {
		var d = new Date(dateString);
		
		var mins = Math.floor((d - refDate) / 60 / 1000);
		
		return mins + ' minute' + ((Math.abs(mins) === 1) ? '' : 's');
	},

	formatTimeString: function(date) {
		var m = moment(date);

		var hourSymbol = "HH";
		var periodSymbol = "";

		if (this.config.timeFormat !== 24) {
			hourSymbol = "h";
			periodSymbol = " A";
		}

		var format = hourSymbol + ":mm" + periodSymbol;

		return m.format(format);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if (notification === "DATA") {
			this.processData(payload);
		} else if (notification === "ERROR") {
			self.updateDom(self.config.animationSpeed);
		} 
	},
});
