// user emails
	
	exports.sendUserMsg = function(to_name, to_email, subject, content) {
		sendEmail(
			config.emailFromName,
			config.emailFromAddress,
			to_name,
			to_email,
			subject,
			content		
		);
	}
	
// team alerts	
	
	exports.sendTeamMsg = function(from_email, subject, content) {
		for (var name in config.teamEmails) {
			sendEmail(
				config.emailFromName,
				from_email,
				name,
				config.teamEmails[name],
				subject,
				content
			);		
		}
	}
	
// mailgun helpers

	function sendEmail(from_name, from_email, to_name, to_email, subject, content) {
		sendMailgunEmail(
			from_name,
			from_email,
			to_name,
			to_email,
			subject,
			content,
			htmlEmailify(content)
		);
	}
	
	function htmlEmailify(content) {
		var output = "<html><head></head><body><p>";
		output += content.replace(new RegExp("\n\r\n\r", 'g'), "</p><p>").replace(new RegExp("\n\r", 'g'), "<br/>");
		output += "</p></body></html>";

		return output;
	}
	
	function sendMailgunEmail(fromName, fromAddress, toName, toAddress, subject, textContent, htmlContent) {
		var querystring = require("querystring"),
		https = require("https");

		var post_data  = querystring.stringify({
		    'from': fromName + " <" + fromAddress + ">",
		    'to': toName + " <" + toAddress + ">",
		    'subject': subject,
		    'text': textContent,
		    'html': htmlContent
		});

		var optionspost = {
		  host : 'api.mailgun.net',
		  path : '/v2/dotvotes.mailgun.org/messages',
		  method : 'POST',
		  headers : {
		    'Content-Type': 'application/x-www-form-urlencoded',
		    'Content-Length': post_data .length,
		    'Authorization': 'Basic ' + new Buffer("api" + ':' + "key-4xh80wm3h55r7in5ejh21sr-psw0tmy1").toString('base64')
			}
		};
		
		var reqPost = https.request(optionspost, function(res) {
			res.setEncoding('utf8');
		});
		
		reqPost.write(post_data);
		reqPost.end();
		reqPost.on('response', function(res) {
			if (res.statusCode != 200) {
				console.log('Error sending mail, status code: ' + res.statusCode);
			}
		});
	}	