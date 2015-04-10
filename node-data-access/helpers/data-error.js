// database error handler
	
	exports.log = function(obj) {
		var path = require("path");
	
		var output = (new Date()).toString() + ": ";
		
		if (obj.model) output += path.basename(obj.model, ".js");

		if (obj.action) output += (" : " + obj.action);
		
		if (obj.code) output += (" : " + obj.code);
		else obj.code = "500";

		if (obj.msg) output += (" : " + obj.msg);
		
		if (obj.err) output += (" : " + obj.err.toString());
		
		if (output != "") console.log(output);		
		
		if (obj.res) obj.res.send({ code: obj.code, message: obj.msg }); 26
	}	