var Board = require(config.boardModel);

// ===== Action to get all the chat associated to a selected board
exports.get = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "getChat",
				code: 500,
				msg: "Error getting board",
				err: err,
				res: res
			});
        }
        else if (board) {
			// Check if this board is private and if so check this user has access
        	if ((!board.isPrivate) ||
        		((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
        		((cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim()))) {
  				res.send({ code: 200, chat: board.chat });
  			}
  			else {
				dataError.log({
					model: __filename,
					action: "getChat",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
  			}
		}
		else {
			dataError.log({
				model: __filename,
				action: "getChat",
				code: 404,
				msg: "Error finding board " + req.params.boardId,
				res: res
			});
		}
	});
}

// ===== Action to insert a new chat item for a board
exports.insert = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "insert",
				code: 500,
				msg: "Error retrieving board",
				err: err,
				res: res
			});
		}
		else {
			if (board) {
				// Check if this board is private and if so check this user has access
	        	if ((!board.isPrivate) ||
	        		((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
	        		((cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim()))) {
					// create the new chat item and add it to the board

					var chatItem = { 
						ownerName: req.body.owner, 
						content: req.body.content, 
						created: new Date() 
					};

					board.chat.push(chatItem);

					board.save(function(err, savedChatItem) {
						if (err) {
							dataError.log({
								model: __filename,
								action: "insert",
								code: 500,
								msg: "Error saving board with added chat",
								err: err,
								res: res
							});
						}
						else {
							res.send({ code: 200, chat: chatItem });
						}
					});
	  			}
	  			else {
					dataError.log({
						model: __filename,
						action: "insert",
						code: 401,
						msg: "Invalid board authentication",
						res: res
					});
	  			}
			}
			else {
				dataError.log({
					model: __filename,
					action: "insert",
					code: 404,
					msg: "Error finding board " + req.params.boardId,
					res: res
				});
			}
		}
	});
};