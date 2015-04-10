define([
	"jquery"
],

function() {
	var Utils = {};

	Utils.createGUID = function() {
		var s4 = function() {
		  return Math.floor((1 + Math.random()) * 0x10000)
		             .toString(16)
		             .substring(1);
		};

	  	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}

	Utils.hexToRgb = function(hex) {
	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    
	    return result ? parseInt(result[1], 16) + "," + parseInt(result[2], 16) + "," + parseInt(result[3], 16) : "43,53,52";
	}

	Utils.sendClientError = function(methodName, err) {
		console.log(err);

		var error = new Error(err);

		$.ajax({
			url: "/clientError",
			type: "POST",
			data: {
				error: methodName + ": " + error.stack,
				line: "",
				uri: "",
				client: navigator.appName,
				version: navigator.userAgent
			}
		});
	};

	return Utils;
});