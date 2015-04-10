define([
	"jquery"
],

function() {
	var Services = {};

	Services.Insert =  function(username, email, password, callback) {
		$.ajax({
			type: "POST",
			url: "/users",
			data: {
				username: username,
				email: email,
				password: password
			},
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	Services.Athenticate = function(username, password, callback) {
		$.ajax({
			type: "POST",
			url: "/auth",
			data: {
				username: username,
				password: password
			},
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	Services.CheckAuthenticated = function(callback) {
		$.ajax({
			type: "GET",
			url: "/checkAuthenticated",
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	return Services;
});