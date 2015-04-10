// Functions to create session Id
	
	exports.createGUID = function() {
		var s4 = function () {
		  	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		};

		return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
	}

// Parse any cookies that have been sent from the client and make them available in global

	exports.parseCookies = function (request) {
		var cookies = [];

		request.headers.cookie && request.headers.cookie.split(";").forEach(function( cookie ) {
			var parts = cookie.split("=");
			cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || "" ).trim();
		});

		return cookies;
	}