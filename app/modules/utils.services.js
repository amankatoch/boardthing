define([
	"jquery"
],

function() {
	var Services = {};

	Services.PostError = function (error, url, line, client, version) {  
        $.ajax({
          url: "/clientError",
          type: "POST",
          data: {
            error: error,
            line: line,
            uri: url,
            client: client,
            version: version
          }
        });
	};

	return Services;
});