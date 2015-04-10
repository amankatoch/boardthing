// Hash password helper
	
	exports.hashPassword = function(password) {
			var bcrypt = require('bcrypt-nodejs');

		try {
			// Generate a salt
			var salt = bcrypt.genSaltSync(10);

			// Hash the password with the salt
			return bcrypt.hashSync(password, salt);
		}
		catch (err) {
			dataError.log({
				model: __filename,
				action: "hashPassword",
				code: 500,
				msg: "Error hashing entered password '" + password + "': " + err.toString(),
			});

			return "";
		}
	}	

// Compare password helper

	exports.comparePasswords = function(submittted, storedPassword) {
		var bcrypt = require('bcrypt-nodejs');

		try {
			return bcrypt.compareSync(submittted, storedPassword); 
		}
		catch (err) {
			dataError.log({
				model: __filename,
				action: "comparePasswords",
				code: 500,
				msg: "Error comparing passwords" +  err.toString(),
			});

			return false;
		}
	}

// Generic functionality to check if someone is authenticated. Needs cleaning up

	exports.checkAuthenticated = function(req, res, callback) {
		var users = require("../controllers/users");

		if (req.isAuthenticated()) {
			var canPasswordProtectBoard = false;

			if(req.user.roles) { 
				for (var i=0; i<req.user.roles.length; i++) {
					for (var j=0; j<userRoles.length; j++) {
						if (req.user.roles[i].trim().toLowerCase() == userRoles[j].trim().toLowerCase()) {
							canPasswordProtectBoard = true;
						}
					}
				}
			}

			var authenticatedUser = {
				_id: req.user._id, 
				sessionId: req.user.sessionId,
				username: req.user.username,
				email: req.user.email,
				canPasswordProtectBoard: canPasswordProtectBoard,
				joined: req.user.joined
			}

			return callback(authenticatedUser);
		}
		else {
			var cookies = utils.parseCookies(req);;

			if(cookies[config.cookieID]) {
				users.getBySessionId(cookies[config.cookieID], function(err, authenticatedUser) {
					if (authenticatedUser) {
						var canPasswordProtectBoard = false;

						if(authenticatedUser.roles) { 
							for (var i=0; i<authenticatedUser.roles.length; i++) {
								for (var j=0; j<userRoles.length; j++) {
									if (authenticatedUser.roles[i].trim().toLowerCase() == userRoles[j].trim().toLowerCase()) {
										canPasswordProtectBoard = true;
									}
								}
							}
						}

						authenticatedUser.canPasswordProtectBoard = canPasswordProtectBoard;
						
						req.login(authenticatedUser, function(err) {
							return callback(authenticatedUser);
						});
					}
					else {
						return callback(null);
					}
				});
			}
			else {
				return callback(null);
			}
		}
	}