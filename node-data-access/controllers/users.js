var User = require(config.userModel),
	Board = require(config.boardModel),
	Card = require(config.cardModel),
	Example = require(config.exampleModel);

// ===== Action to retrive a selected user by their email address. Not web facing
exports.getByEmail = function (email, callback) {
	User
	.find({ email: new RegExp(email, "i") })
	.exec(function(err, users) {
		if (err) {
			callback(err, null);
		}
		else {
			var userFound = false;

			for (var i=0, usersLength = users.length; i<usersLength; i+=1) {
				var user = users[i];

				// check if the users email exactly matches the one provided. the irreguar characters sometimes provide false positives
				if ((user) && (user.email) && (email) && (user.email.trim().toLowerCase() == email.trim().toLowerCase())) {
					userFound = true;

					// return the found user
					var returnUser = {
						_id: user._id,
						sessionId: user.sessionId,
					    username: user.username,
					    password: user.password,
					    email: user.email,
					    roles: user.roles,
					    joined: user.joined
					};

		        	callback(null, returnUser);
		        	break;
		        }
		    }
		    
		    if (!userFound) callback(null, null);
        }
	});
}

// ===== Action to retrive a selected user by their ID. Not web facing
exports.getById = function (id, callback) {
	User
	.findById(id)
	.exec(function(err, user) {
		if (err) {
			callback(err, null);
		}
		else {
			// check that this user exists
			if (user) {
				var returnUser = {
					_id: user._id,
					sessionId: user.sessionId,
				    username: user.username,
				    password: user.password,
				    email: user.email,
				    roles: user.roles,
				    joined: user.joined
				};

	        	callback(null, returnUser);
	        }
	        else {
	        	callback(null, null);
	        }
        }
	});
}

// ===== Action to retrive a selected user by their session ID. Not web facing
exports.getBySessionId = function (id, callback) {
	User
	.findOne({ sessionId: id })
	.exec(function(err, user) {
		if (err) {
			callback(err, null);
		}
		else {
			// check that this user exists
			if (user) {
				var returnUser = {
					_id: user._id,
					sessionId: user.sessionId,
				    username: user.username,
				    password: user.password,
				    email: user.email,
				    roles: user.roles,
				    joined: user.joined
				};

	        	callback(null, returnUser);
	        }
	        else {
	        	callback(null, null);
	        }
        }
	});
}

// ===== Action to save a session ID against a selected user. Not web facing
exports.saveSessionId = function (id, sessionId) {
	User
	.findById(id)
	.exec(function(err, user) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "saveSessionId",
				code: 500,
				msg: "Error retrieving user",
				err: err
			});
		}
		else {
			user.sessionId = sessionId;
			user.save();
		}
	});
}

// ====== Get the details of the currently authenticated user
exports.get = function (req, res) {
	User
	.findById(req.user._id)
	.exec(function(err, user) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "get",
				code: 500,
				msg: "Error retrieving user",
				err: err,
				res: res
			});
		}
		else {
			var returnUser = {
				_id: user._id,
				username: user.username,
				email: user.email,
				joined: user.joined
			};

        	res.send({ code: 200, user: returnUser });
        }
	});
} 

// ===== Send a password reminder out to a user who has requested it
exports.sendUserPassword = function(req,res) {
	User
	.findOne({ email: new RegExp("^" + req.body.email + "$", "i") })
	.exec(function(err, user) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "sendUserPassword",
				code: 500,
				msg: "Error retrieving user",
				err: err,
				res: res
			});
		}
		else if (user) {
			// Build the content for the password reset e-mail
			var resetEmailContent = "A password reset has been requested for your BoardThing account.\n\r\n\rIf you did not make this request, you can safely ignore this email. A password reset request can be made by anyone, and it does not indicate that your account is in any danger of being accessed by someone else.\n\r\n\rIf you do actually want to reset your password, visit this link:\n\r\n\rhttp://www.boardthing.com/resetPassword/" + user._id + "\n\r\n\rThanks for using the site!";

			// Send the password reminder to the selected user
			email.sendUserMsg(user.username, user.email, "Password reset for BoardThing", resetEmailContent);

			res.send({ code: 200 });  
		}
		else {
			dataError.log({
				model: __filename,
				action: "sendUserPassword",
				code: 404,
				msg: "Error retrieving user",
				err: err,
				res: res
			}); 
		}
	});
}

// ===== Action to create a new user
exports.insert = function (req, res) {
	console.log("DOOOOOM")


	if (req.isAuthenticated()) req.logout();

	// build the new user details
	var user = new User({ 
	    username: req.body.username.trim(),
	    email: req.body.email.trim(),
	    password: security.hashPassword(req.body.password),
	    note: req.body.note
	});

	// attempt to find any other users with the same email. user emails must be unique
	User
	.find({ email: new RegExp(req.body.email, "i") })
	.exec(function(err, existingUsers) {
		var userExists = false;

		for (var i=0, existingUsersLength=existingUsers.length; i<existingUsersLength; i+=1) {
			if ((existingUsers[i]) && (existingUsers[i].email) && (req.body.email) && (existingUsers[i].email.trim().toLowerCase() == req.body.email.trim().toLowerCase())) {
				userExists = true;
	        	break;
	        }
	    }

	    // if the no user exists with the same email address the allow the user to be created
		if (!userExists) {
			user.save(function (err, savedUser) {
				if (err) {
					dataError.log({
						model: __filename,
						action: "insert",
						code: 500,
						msg: "Error saving user",
						err: err,
						res: res
					});
				}
				else {
		        	res.send({ code: 200, user: savedUser });
		        }
			});
		}
		else {
			res.send({ 
				code: 403, 
				message: "An account already exists for your e-mail" 
			});
		}
	})
}

// ===== Actions to update a users details
exports.update = function (req, res) {
	// get all the users currently existing with the email address specified for a users profile
	User
	.find({ email: new RegExp(req.body.email, "i") })
	.exec(function(err, existingUsers) {
		var userExists = false;

		for (var i=0, existingUsersLength=existingUsers.length; i<existingUsers.length; i+=1) {
			// if a user exists with the specified email address then check that it's the user doing the update. Email addresses must be unique
			if ((existingUsers[i]) && 
				(existingUsers[i]._id.toString() != req.user._id.toString()) && 
				(existingUsers[i].email.trim().toLowerCase() == req.body.email.trim().toLowerCase())) {
				userExists = true;
	        	break;
	        }
	    }

	    // check that we can proceed with the update
		if (!userExists) {
			User
			.findById(req.user._id)
			.exec(function(err, existingUser) {
				if (existingUser) {
					// update the username, email and password if specified of the currently authenticated user

				    existingUser.username = req.body.username;
				    existingUser.email = req.body.email;

				    if (req.body.password)  existingUser.password = security.hashPassword(req.body.password);

				    existingUser.save(function (err, savedUser) {
						if (err) {
							dataError.log({
								model: __filename,
								action: "update",
								code: 500,
								msg: err
							});

							res.send({ code: 500, message: "Unable to update your profile" });
						}
						else {
							res.send({ code: 200 });
						}
					});
				}
				else {
					dataError.log({
						model: __filename,
						action: "update",
						code: 500,
						msg: "Unable to find profile for " + req.user._id
					});	

					res.send({ code: 500, message: "Unable to update your profile" });
				}
			});
		}
		else {
			res.send({ 
				code: 403, 
				message: "That e-mail address is currently in use" 
			});
		}
	});
}

// ===== Action to update the password of a selected user
exports.resetPassword = function (req, res) {
	User
	.findById(req.params.id)
	.exec(function(err, user) {
		if (user) {
			// hash the password provided by the user for storage in the database
			user.password = security.hashPassword(req.body.password);

			// check if the user has stated during the password reset that they want to receive further communication from Boardthing
			if ((req.body.acceptCommunication != null) && (req.body.acceptCommunication != ""))  user.acceptCommunication = req.body.acceptCommunication;
			
			user.save(function (err, savedUser) {
				if (err) {
					dataError.log({
						model: __filename,
						action: "resetPassword",
						code: 500,
						msg: "An error occurred",
						err: err,
						res: res
					});
				}
				else { 
					returnUser = {
						id: savedUser.id,
						email: savedUser.email
					};

					res.send({ code: 200, user: returnUser });
				}
			});
		}
		else {
			dataError.log({
				model: __filename,
				action: "resetPassword",
				code: 404,
				msg: "Unable to find your account",
				res: res
			});	
		}
	});
}

// === Action to update an authenticated users shared boards
exports.updateSharedBoards = function (req, res) {
	User
	.findById(req.user._id)
	.exec(function(err, user) {
		if (err) dataError.log({
			model: __filename,
			action: "updateSharedBoards",
			code: 500,
			msg: "Error retrieving user",
			err: err,
			res: res
		});
		else {
			Board
			.findById(req.params.boardId)
			.exec(function(err, board) {
				if (err) {
					dataError.log({
						model: __filename,
						action: "updateSharedBoards",
						code: 500,
						msg: "Error retrieving user",
						err: err,
						res: res
					});
				}
				else if (board) {
					// check that the current user is not the owner of the board (you don't have your own board in your shared boards list)
					if (board.owner.toString() != req.user._id.toString()) {
						var boardSaved = false;

						// search the current users shared boards and make sure that they don't already have the board in their shared boards
						for (var i=0, userSharedBoardsLength=user.sharedBoards.length; i<userSharedBoardsLength; i++) {
							if ((user.sharedBoards[i]) && (user.sharedBoards[i]._id.toString() == req.params.boardId.toString())) {
								boardSaved = true;
								break;
							}
						}

						// if they don't have selected board in their shared board list then add and update
						if (!boardSaved) {
							user.sharedBoards.push(req.params.boardId);
							user.save();
						}
				   	}
				   		
				   	res.send({ code: 200 });
		        }
				else {
					dataError.log({
						model: __filename,
						action: "updateSharedBoards",
						code: 404,
						msg: "Could not find board",
						res: res
					});
				}
	        });	
        }
	});
} 

// ===== Get whether or not to display hints to a user when they first arrive at a board
exports.getDisplayCardAddHint = function (req, res) {
	User
	.findById(req.user._id)
	.exec(function(err, user) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "getDisplayCardAddHint",
				scode: 500,
				msg: "Error retrieving user",
				err: err,
				res: res
			});
		}
		else {
			var displayCardAddHint = user.displayCardAddHint

			// If we dont have this set then we assume that we should be displaying the hints
			if (displayCardAddHint == null) {
				displayCardAddHint = true;
			}

        	res.send({ code: 200, displayCardAddHint: displayCardAddHint });
        }
	});
} 

// ===== Perminantly stop the current user from receiving hints when they access a board
exports.disableDisplayCardAddHint = function (req, res) {
	User
	.findById(req.user._id)
	.exec(function(err, user) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "disableDisplayCardAddHint",
				code: 500,
				msg: "Error retrieving user",
				err: err,
				res: res
			});
		}
		else {
			// Set the display hints to false and save

			user.displayCardAddHint = false;
			user.save();

        	res.send({ code: 200 });
        }
	});
} 