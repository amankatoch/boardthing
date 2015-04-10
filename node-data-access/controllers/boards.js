var User = require(config.userModel),
	Workspace = require(config.workspaceModel),
	Board = require(config.boardModel),
	Card = require(config.cardModel);

// ===== Action to get the background for the board. The this is placed on the HTML canvas which users can draw on
exports.getBackground = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.id)
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "getBackground",
				code: 500,
				msg: "Error getting board",
				err: err,
				res: res
			});
        }
        else if (board) {
			// Check if this board is private and if so check this user has access
    		if ((!board.isPrivate)||
    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
					res.send({ code: 200, background: board.background });
    		}
    		else {
				dataError.log({
					model: __filename,
					action: "getBackground",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
		}
		else {
			dataError.log({
				model: __filename,
				action: "getBackground",
				code: 404,
				msg: "Error finding board " + req.params.id,
				res: res
			});
		}
	});
};

// ===== Actions to create a new board
exports.insert = function (req, res) {
	Workspace
	.findById(req.params.id)
	.select("boardWidth boardHeight")
	.exec(function(err, workspace) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "insert",
				code: 500,
				msg: "Error retrieving workspace for id: " + req.params.id,
				err: err,
				res: res
			});
		}
		else if (workspace) {
			Board
			.find({ workspace: req.params.id })
			.select("_id")
			.exec(function(err, boards) {
				// create and save the new board

				var board = new Board({ 
					workspace: req.params.id,
					title: req.body.title,
				    created: new Date(),
					positionX: req.body.positionX,
					positionY: req.body.positionY,
			    	lastModified: new Date()
				});

				board.save(function (err, newBoard) {
					if (err) {
						dataError.log({
							model: __filename,
							action: "insert",
							code: 500,
							msg: "Error saving board",
							err: err,
							res: res
						});
					}
					else {
						// return the new baord back to client

						var returnBoard = {
							id: newBoard._id, 
						    workspace: newBoard.workspace,
						    owner: newBoard.owner,
							title: newBoard.title,
							positionX: newBoard.positionX,
							positionY: newBoard.positionY,
						    width: workspace.boardWidth,
						    height: workspace.boardHeight,
						    created: newBoard.created,
						    lastModified: newBoard.lastModified
						};
						
						res.send({ code: 200, board: returnBoard });
					}
				});
			});
        }
        else {
			dataError.log({
				model: __filename,
				action: "insert",
				code: 404,
				msg: "Unable to find workspace " + req.params.id,
				res: res
			});
        }
	});
};

// ====== Update the title of a board (could add more metadata if requireds)
exports.update = function (req, res) {
	Board
	.findById(req.params.id)
	.populate("workspace")
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "update",
				code: 500,
				msg: "Error getting board",
				err: err,
				res: res
			});
        }
        else {
        	// check that the update is being requested by the boards owner
	        if ((board != null) && (board.workspace.owner.toString() == req.user._id.toString())) {
	        	// update the title of the board and save it
	        	board.title = req.body.title;
	        	board.lastModified = new Date();

		        board.save(function (err, board) {
					if (err) {
						dataError.log({
							model: __filename,
							action: "update",
							code: 500,
							msg: "Error saving board",
							err: err
						});
					}	
					else  res.send({ code: 200, board: board });
				});
			}
			else {
				dataError.log({
					model: __filename,
					action: "update",
					code: 404,
					msg: "Error finding board " + req.params.boardId,
					res: res
				});
			}
		}
	});
};

// ===== Action to set the board background. This is based on the HTML canvas that people can draw on
exports.updateBackground = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.id)
	.populate("workspace")
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "updateBackground",
				code: 500,
				msg: "Error getting board",
				err: err,
				res: res
			});
        }
        else if (board) {
			// Check if this workspace is private and if so check this user has access
        	if ((!board.workspace.isPrivate) ||
        		((req.isAuthenticated()) && (board.workspace.owner.toString() == req.user._id.toString())) || 
        		((cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.workspace.password.trim()))) {
	        	// Update the background image stored for this boards

	        	board.background = req.body.background;
	        	board.lastModified = new Date();

		        board.save(function (err, board) {
					if (err) {
						dataError.log({
							model: __filename,
							action: "updateBackground",
							code: 500,
							msg: "Error saving board",
							err: err,
							res: res
						});
					}
					else {
		  				res.send({ code: 200 });
					}
				});
		    }
		    else {
				dataError.log({
					model: __filename,
					action: "updateBackground",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
		    }
		}
		else {
			dataError.log({
				model: __filename,
				action: "updateBackground",
				code: 404,
				msg: "Error finding board " + req.params.id,
				res: res
			});
		}
	});
};

// ===== Action to set the board background. This is based on the HTML canvas that people can draw on
exports.updatePosition = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.id)
	.populate("workspace")
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "updatePosition",
				code: 500,
				msg: "Error getting board",
				err: err,
				res: res
			});
        }
        else if (board) {
			// Check if this workspace is private and if so check this user has access
        	if ((!board.workspace.isPrivate) ||
        		((req.isAuthenticated()) && (board.workspace.owner.toString() == req.user._id.toString())) || 
        		((cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.workspace.password.trim()))) {
	        	
	        	// Update the background image stored for this boards
	        	board.positionX = req.body.positionX;
	        	board.positionY = req.body.positionY;
	        	board.lastModified = new Date();

		        board.save(function (err, board) {
					if (err) {
						dataError.log({
							model: __filename,
							action: "updatePosition",
							code: 500,
							msg: "Error saving board",
							err: err,
							res: res
						});
					}
					else {
		  				res.send({ code: 200 });
					}
				});
		    }
		    else {
				dataError.log({
					model: __filename,
					action: "updatePosition",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
		    }
		}
		else {
			dataError.log({
				model: __filename,
				action: "updatePosition",
				code: 404,
				msg: "Error finding board " + req.params.id,
				res: res
			});
		}
	});
};

// ===== Action to delete a board
exports.delete = function (req, res) {
	/*var path = require('path'),
		amazonClient = authenticateAmazonS3();*/

	Board
	.findById(req.params.id)
	.populate("workspace")
	.exec(function(err, board) {
		// Check that you are the owner of the worjspace
        if ((board) && (board.workspace) && (board.workspace.owner.toString() == req.user._id.toString())) {
        	// you own the baord you are attempting to delete

        	// loop through all the cards associated to this board
			Card
			.find({ board: board._id })
			.exec(function(err, cards) {
				for (var j=0; j<cards.length; j++) {

					// if this card is a image card then deete it from the Amazon bucket
					/*if (cards[j].type.trim().toLowerCase() != "text") {
						amazonClient.deleteFile(board._id.toString() + "/" +  cards[j].content, function(err, res) {
							if (err) dataError.log({
								model: __filename,
								action: "delete",
								code: 500,
								msg: "Error deleting image",
								err: err
							});
						});
					}*/

					// remove the card from the database
					cards[i].remove();

					cards[i].save();
				}
			});

			// remove the board from the database
	        board.remove();

	        board.save(function (err, savedBoard) {
				if (err) {
					dataError.log({
						model: __filename,
						action: "delete",
						code: 500,
						msg: "Error saving board",
						err: err,
						res: res
					});
				}
				else {
					res.send({ code: 200 });
				}
			});
	    }
 	});
};