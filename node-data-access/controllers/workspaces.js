var User = require(config.userModel),
	Workspace = require(config.workspaceModel),
	Board = require(config.boardModel);

// ===== action to retrieve all the workspaces for the currently logged in user
exports.getAll = function (req, res) {
	var moment = require("moment");

	// find all the workspaces owned by the logged in user
	Workspace
	.find({ owner: req.user._id })
	.select("_id owner title isPrivate password boards created")
	.populate("owner")
	.exec(function(err, workspaces) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "getAll",
				code: 500,
				msg: "Error retrieving workspaces",
				err: err,
				res: res
			});
		}
		else {
			var returnList = [];

			// add the workspaces owned by the currently logged in user to the list of workspaces to return
			for (var i=0, workspacesLength = workspaces.length; i<workspacesLength; i+=1) {
				var isPrivate = false;

				if ((workspaces[i].isPrivate != undefined) && (workspaces[i].isPrivate != null)) isPrivate = workspaces[i].isPrivate;

				var returWorkspace = {
					id: workspaces[i]._id,
				    title: workspaces[i].title,
				    isPrivate: isPrivate,
    				password: workspaces[i].password,
				    created: workspaces[i].created,
				    createdAt: moment(workspaces[i].created).fromNow(),
				    owner: {
				    	id: workspaces[i].owner._id,
				    	username: workspaces[i].owner.username
				    },
				    isOwner: true
				};

				returnList.push(returWorkspace);
			}

			// retrieve all the workspaces that the user has previously accessed but does not own
			User
			.findById(req.user._id)
			.select("sharedWorkspaces")
			.exec(function(err, user) {
				if (err) {
					dataError.log({
						model: __filename,
						action: "getAll",
						code: 500,
						msg: "Error retrieving user",
						err: err,
						res: res
					});
				}
				else if (user) {
					var sharedWorkspaceIds = [];

					for (var i=0, sharedWorkspacesLength = user.sharedWorkspaces.length; i<user.sharedWorkspacesLength; i++) {
						sharedWorkspaceIds.push(user.sharedWorkspaces[i]._id);								
					}

					if (sharedWorkspaceIds) {
						// retrieve the details of all the workspaces that the current user has previously accessed
						Workspace
						.find({ _id: { $in: sharedWorkspaceIds } })
						.select("_id owner title created isPrivate lastModified")
						.populate("owner")
						.exec(function(err, sharedWorkspaces) {
							// add the shared workspaces with the details to the list of workspaces to be returned
							for (var i=0, sharedWorkspacesLength = sharedWorkspaces.length; i<sharedWorkspacesLength; i+=1) {
								var isPrivate = false;

								if ((sharedWorkspaces[i].isPrivate != undefined) && (sharedWorkspaces[i].isPrivate != null)) isPrivate = sharedWorkspaces[i].isPrivate;

								returnList.push({
									id: sharedWorkspaces[i]._id,
								    owner: {
								    	id: sharedWorkspaces[i].owner._id,
								    	username: sharedWorkspaces[i].owner.username
								    },
								    title: sharedWorkspaces[i].title,
				    				isPrivate: isPrivate,
				    				password: "",
								    created: moment(sharedWorkspaces[i].created).fromNow(),
						    		isOwner: false,
			    					sharedStatus: "Shared"
								})
							}

				        	res.send({ code: 200, workspaces: returnList });
						});
					}
					else {
				       	res.send({ code: 200, workspaces: returnList });
					}
		        }
		        else {
		        	dataError.log({
						model: __filename,
						action: "getAll",
						code: 404,
						msg: "Unable to find user"
					});
				    
				    res.send({ code: 200, workspaces: returnList });
		        }
			});
        }
	});
}

/* ===== Action to retreive all the details of a selected workspace 
   ok, this is a little complex. workspaces can either be retrieved by general workspace id or jump or jump directly
   to a specific board. So, first we check if it's a board id and if that doesn't link to anything we assume it's a workspace
   id. Finally we process the workspace once we have checked for both options
*/
exports.get = function (req, res) {
	// check if this is a link to a board
	Board
	.findById(req.params.id)
	.select("_id workspace")
	.exec(function(err, board) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "getAll",
				code: 500,
				msg: "Error retrieving boards",
				err: err,
				res: res
			});
		}
		else if (board) {
			// this was a link to a board so retrieve it's parent workspace
			getWorkspace(res, req, board.workspace, req.params.id, buildReturnWorkspace);
		}
		else {
			// this wasn't a link to a board so attempt to get the workspace
			getWorkspace(res, req, req.params.id, null, buildReturnWorkspace);	
		}
	});
};

// ===== Retrieve a workspace based on a given id and pass the results on to a provided callback
var getWorkspace = function(res, req, workspaceId, startingBoardId, callback) {
	Workspace
	.findById(workspaceId)
	.select("_id owner title isPrivate password created boardWidth boardHeight")
	.exec(function(err, workspace) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "get",
				code: 500,
				msg: "Error retrieving workspace for id: " + workspaceId,
				err: err
			});

			return callback(res, req, null);
		}
		else if (workspace) {
			// a workspace must load with a starting board. Set that board if we know it at this points
			workspace.startBoardId = startingBoardId;

			callback(res, req, workspace);
        }
        else {
			callback(res, req, null);
        }
	});
};

var buildReturnWorkspace = function(res, req, workspace) {
	var moment = require("moment");

	if (workspace) {
		// put together the details of the wordspace requested
		var returnWorkspace = {
			id: workspace._id,
		    startBoardId: workspace.startBoardId,
		    owner: workspace.owner,
		    isOwner: ((req.isAuthenticated()) && (req.user._id.toString() == workspace.owner.toString())),
		    title: workspace.title,
		    boardWidth: workspace.boardWidth,
		    boardHeight: workspace.boardHeight,
		    boards: [],
		    isPrivate: workspace.isPrivate,
		    created: workspace.created,
	    	createdAt: moment(workspace.created).fromNow()
		};

		// only include the workspace password if this is the workspace ower requesting it
		if (returnWorkspace.isOwner) returnWorkspace.password = workspace.password;

		Board
		.find({ workspace: workspace._id })
		.select("_id title positionX positionY created lastModified")
		.sort({ position: 'asc' })
		.exec(function(err, boards) {
			if (err) {
				dataError.log({
					model: __filename,
					action: "getAll",
					code: 500,
					msg: "Error retrieving boards",
					err: err,
					res: res
				});
			}
			else if (boards) {
				// add the boards owned by the currently logged in user to the list of boards to return
				for (var i=0, boardsLength = boards.length; i<boardsLength; i+=1) {
					var lastModified = "";

					if (boards[i].lastModified) lastModified = moment(boards[i].lastModified).fromNow();

					var returnBoard = {
						id: boards[i]._id,
					    title: boards[i].title,
					    positionX: boards[i].positionX,
					    positionY: boards[i].positionY,
					    cards: [],
					    created: boards[i].created,
					    lastModified: lastModified
					};

					returnWorkspace.boards.push(returnBoard);

					returnWorkspace.boards.sort(function (a, b) { 
						return a.positionX > b.positionX ? 1 : a.positionX < b.positionX ? -1 : 0; 
					});

					returnWorkspace.boards.sort(function (a, b) { 
						return a.positionY > b.positionY ? 1 : a.positionY < b.positionY ? -1 : 0; 
					});

					if ((!returnWorkspace.startBoardId) && ((boards[i].positionX == 1) && (boards[i].positionY == 1))) returnWorkspace.startBoardId = boards[i]._id;
				}
			}

			// check if the request is from an authenticated user and if so if it's not workspace board owner. we want to add this workspace to the users shared workspaces
			if ((req.isAuthenticated()) && (workspace.owner.toString() != req.user._id.toString())) {
				// retrieve the user that is reqesting access to the workspace
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
					else if (user) {
						// check that if this is a private workspace. private workspace aren't added to a users list of shared workspace
						if (!workspace.isPrivate) {
							var workspaceSaved = false;

							// check if this user already has the selected board in their list of shared boards
							for (var i=0, userSharedBoardsLength = user.sharedWorkspaces.length; i<userSharedBoardsLength; i+=1) {
								if ((user.sharedWorkspaces[i]) && (user.sharedWorkspaces[i]._id.toString() == req.params.id.toString())) {
									workspaceSaved = true;
									break;
								}
							}

							// if they currently don't have the workspace in their list of shared workspace then add it
							if (!workspaceSaved) {
								user.sharedWorkspaces.push(req.params.id);
								user.save();
							}
						}

	       				res.send({ code: 200, workspace: returnWorkspace });
			        }
			        else {
			        	dataError.log({
							model: __filename,
							action: "get",
							code: 404,
							msg: "Unable to find user"
						});

	       				res.send({ code: 200, workspace: returnWorkspace });
					}
				});
			}
			else {
	       		res.send({ code: 200, workspace: returnWorkspace });
			}
		});
	}
	else {
		dataError.log({
			model: __filename,
			action: "get",
			code: 404,
			msg: "Unable to retrieve workspace",
			res: res
		});
	}
};

// ===== Actions to create a new board
exports.insert = function (req, res) {
	var moment = require("moment");

	// create and save the new board

	var workspace = new Workspace({ 
	    owner: req.user._id,
		title: req.body.title,
		boards: [],
		chat: [],
    	isPrivate: false,
    	password: "",
	    created: new Date()
	});

	workspace.save(function (err, newWorkspace) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "insert",
				code: 500,
				msg: "Error saving workspace",
				err: err,
				res: res
			});
		}
		else {
			var board = new Board({ 
				workspace: newWorkspace._id,
				title: req.body.title,
				positionX: 1,
				positionY: 1,
			    created: new Date(),
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
					// return the new workspace back to client

					var returnWorkspace = {
						id: newWorkspace._id, 
					    owner: newWorkspace.owner,
						title: newWorkspace.title,
					    created: newWorkspace.created,
					    createdAt: moment(newWorkspace.created).fromNow()
					};
					
					res.send({ code: 200, workspace: returnWorkspace });
				}
			});
		}
	});
};

// ===== Action for private workspaces to authenticate a provided password to see if they are allowed access
exports.authenticateWorkspace = function (req, res) {
	Workspace
	.findById(req.params.id)
	.exec(function(err, workspace) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "authenticateWorkspace",
				code: 500,
				msg: "Error retrieving workspace",
				err: err,
				res: res
			});
        }
        else if (workspace) {
        	// check if the password provided matches the workspaces password
        	if (workspace.password.trim() == req.body.password.trim()) res.send({ code: 200 });
        	else res.send({ code: 401, message: "Incorrect password" });
        }
		else {
			dataError.log({
				model: __filename,
				action: "authenticateWorkspace",
				code: 404,
				msg: "Unable to find workspace " + req.params.id,
				res: res
			});
		}
	});
};

// ===== Actions to update the password of a workspace, which will set it as private or public
exports.updatePassword = function (req, res) {
	Workspace
	.findById(req.params.id)
	.exec(function(err, workspace) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "updatePassword",
				code: 500,
				msg: "Error getting workspace",
				err: err,
				res: res
			});
        }
        else {
        	// check that the password request is coming from the boards owner
	        if ((workspace != null) && (workspace.owner.toString() == req.user._id.toString())) {
				if ((req.body.password) && (req.body.password.trim().length > 0)) {
					// a password is defined so update the workspace password and set it to private
		        	workspace.isPrivate = true;
		        	workspace.password = req.body.password;
				}
				else {
					// a password is not defined so blank the password and set the workspace public
		        	workspace.isPrivate = false;
		        	workspace.password = null;
				}

		        workspace.save(function (err, workspace) {
					if (err) {
						dataError.log({
							model: __filename,
							action: "updatePassword",
							code: 500,
							msg: "Error saving workspace",
							err: err,
							res: res
						});
					}	
					else {
			  			res.send({ code: 200, workspace: workspace });
			  		}
				});
			}
			else {
				dataError.log({
					model: __filename,
					action: "updatePassword",
					code: 404,
					msg: "Error finding workspace " + req.params.id,
					res: res
				});
			}
		}
	});
};

// ===== Actions to update the password of a workspace, which will set it as private or public
exports.updateBoardPositions = function (req, res) {
	Board
	.find({ workspace: req.params.id })
	.select("_id title position")
	.exec(function(err, boards) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "getAll",
				code: 500,
				msg: "Error retrieving boards",
				err: err,
				res: res
			});
		}
		else if (boards) {
			var boardPositions = req.body.boardPositions;
						console.log(req.body.boardPositions);

			for (var i=0, boardsLength=boards.length; i<boards.length; i+=1) {
				for (var j=0, boardPositionsLength=boardPositions.length; j<boardPositions.length; j+=1) {
					if (boards[i]._id.toString() == boardPositions[j].boardId.toString()) {
						console.log("--------------------------------");
						console.log(boards[i]._id);
						console.log(boards[i].title);
						console.log(boards[i].position);
						console.log(boardPositions[j].position);

						boards[i].position = boardPositions[j].position;
						boards[i].save();
						break;
					}
				}
			}
		}
	});
};

// Lets not worry about the save as and export until we're further down the line
/* // ===== The action to save a selected board as a new board with a different name
exports.saveAs = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "saveAs",
				msg: "Error saving board",
				err: err,
				res: res
			});
        }
        else {
	        if (board) {
	        	// check if this is a private board. Only the owner of a private board is able to perform a save as against it
	        	var boardIsPrivate = false

	        	if (board.isPrivate != null) {
					boardIsPrivate = board.isPrivate;	        		
	        	}

	        	if ((!boardIsPrivate) || 
	        		(board.owner.toString() == req.user._id.toString()) || 
	        		((boardIsPrivate) && (cookies["BoardThing_" + board._id + "_password"]) && (cookies["BoardThing_" + board._id + "_password"] == board.password))) {
					// check that you dont current have a board with the same name as what you attempting to save as
					Board
					.find({ title: new RegExp('^' + req.body.title + '$', "i") })
					.exec(function(err, existingBoards) {
						if ((existingBoards) && (existingBoards.length === 0)) {
							// create the new board with the same details as the source but a different name
							var newBoard = new Board({ 
							    owner: req.user._id,
								title: req.body.title,
								background: board.background,
								isPrivate: false,
								password: null,
							    created: new Date(),
						    	lastModified: new Date()
							});

							newBoard.save(function (err, newBoard) {
								if (err) {
									dataError.log({
										model: __filename,
										action: "saveAs",
										msg: "Error saving board",
										err: err,
										res: res
									});
								}
								else {
									// find all the cards associated to the source baord
									Card
									.find({ board: board._id })
									.exec(function(err, cards) {
										// because of parent/child relationships we can't just create new cards with the same details. 
										//We need to do them synchronously so we can match up the new ids between oarent and children.

										var idMap = [];

										var amazonClient = authenticateAmazonS3();

										var async = require("async");

										async.eachSeries(cards, function(card, callback) {
											// create the new card with the same details as the source card
											var newCard = new Card({
												board: newBoard._id,
											    parentId: card.parentId,
												title: card.title,
											    content: card.content,
											    type: card.type,
											    created: card.created,
												collapsed: card.collapsed,
											    children: card.children,
											    isVoting: card.isVoting,
											    votesReceived: card.votesReceived,
											    isLocked: card.isLocked,
											    width: card.width,
											    height: card.height,
											    xPos: card.xPos,
											    yPos: card.yPos,
											    zPos: card.zPos,
											    color: card.color
											});

											// if this is an image card then we need to copy the image stored in the amazon bucket
											if (card.type.trim().toLowerCase() != "text") amazonClient.copyFile(req.params.boardId + "/" + card.content, newBoard._id + "/" + card.content, function(err, res){});
									
											newCard.save(function(err, savedCard) {
												// store the new id of the card against what the source cards id is
												idMap.push({ oldId: card._id, newId: savedCard._id });
												callback();
											});

										}, function(err) {
											// we've inserted all the new cards and now we need to line up the parent child relationships with the new ids
											Card
											.find({ board: newBoard._id })
											.exec(function(err, newCards) {
												// loop through all the cards associated to the newly created board
												for (var i=0, newCardsLength = newCards.length; i<newCardsLength; i++) {
													var newChildren = [];

													// loop through the id mappings
													for (var j=0, idMapLength = idMap.length; j<idMapLength; j++) {
														// replace the old parent ID with ID the maps to in the new board
														if ((newCards[i].parentId) && (idMap[j].oldId.toString() == newCards[i].parentId)) newCards[i].parentId = idMap[j].newId.toString();

														// if this card has children then fix the mapping to previous boards cards with the new boards ones
														if (newCards[i].children) {
															for (var k=0, newCardsChildrenLength = newCards[i].children.length; k<newCardsChildrenLength; k++) {
																if (newCards[i].children[k] == idMap[j].oldId.toString()) newChildren.push(idMap[j].newId.toString()); 
															}
														}
													}

													// update the children for the card with the new mappig. We can just alert the array in line as for some reason this doesn't save through
													newCards[i].children = newChildren;

													newCards[i].save();
												}
											});
										});

										res.send({ code: 200 });
									});
								}
							});
						}
						else {
							dataError.log({
								model: __filename,
								action: "saveAs",
								msg: "Board title already taken",
								res: res
							});
						}
					});
				} 
				else {
					dataError.log({
						model: __filename,
						action: "saveAs",
						msg: "Unauthorized save attempt for " + req.params.boardId,
						res: res
					});
				}
			}
			else  {
				dataError.log({
					model: __filename,
					action: "saveAs",
					msg: "Error finding board " + req.params.boardId,
					res: res
				});
			}
		}
	});
};

// ===== Action to ecport the contents of a selected board. This can be done as HTML, plain text or OPML. DEFINITELY not the best implemented feature
exports.export = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.id)
	.populate("owner")
	.exec(function(err, board) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "export",
				msg: "Error retrieving board",
				err: err,
				res: res
			});
		}
		else if (board) {
			// Check if this board is private and if so check this user has access
        	if ((!board.isPrivate) || 
        		(board.owner._id.toString() == req.user._id.toString()) || 
        		((board.isPrivate) && (cookies["BoardThing_" + board._id + "_password"]) && (cookies["BoardThing_" + board._id + "_password"] == board.password))) {
				// Retrieve all the cards for a selected board
				Card
				.find({ board: board._id })
				.exec(function(err, cards) {
					// firstly, sort the baords by their zposition. This will get things in the correct order when exporting clusters
					cards.sort(function (a, b) { 
						return a.zPos > b.zPos ? 1 : a.zPos < b.zPos ? -1 : 0; 
					});

					// next find all of the root cards. So, any cards without a parent
					var rootElements = [];

					for (var i=0, cardsLength = cards.length; i<cardsLength; i++) {
						if (!cards[i].parentId) rootElements.push(cards[i]);
					}

					// sort these by their X/Y position going from top left to bottom right
					rootElements.sort(function sortByPosition(a, b){
						if (a.xPos == b.xPos) return a.yPos - b.yPos;

						return a.xPos - b.xPos;
					})

					if(req.params.format == "html") {
						// this is an HTML export so build the data structure using ul and li elements
						var htmlString = "<html><head></head><body><ul>";

						for (var i=0, rootElementsLength = rootElements.length; i<rootElementsLength; i++) {
							if (cards[i].type == "text") {
								htmlString += "<li>" + rootElements[i].content + "</li>";
							}
							else {
								if (cards[i].title.trim().length > 0) htmlString += "<li><img src=\"" + config.url + "/boards/cards/image/" + req.params.id + "/" + rootElements[i]._id + "\" /><br/>" + rootElements[i].title + "</li>";
								else htmlString += "<li><img src=\"" + config.url + "/boards/cards/image/" + req.params.id + "/" + rootElements[i]._id + "\" /></li>";
							}
							
							// we need to recurse through children in order to build up the HTML structure
							if (rootElements[i].children.length > 0) {
								htmlString += "<ul>";
								htmlString += appendDownloadChildren(req.params.id,rootElements[i].children,cards,0,"html");
								htmlString += "</ul>";
							}	
						}

						htmlString += "</ul></body></html>";

						res.setHeader('Content-disposition', 'attachment; filename=' + board.title + ".html");
					  	res.setHeader('Content-type', "text/html");
						res.send(htmlString);
					}
					else if(req.params.format == "text") {
						// this is a plain text export so represent the structure with "'" and spaces
						var textString = "";

						for (var i=0; i<rootElements.length; i++) {
							if (rootElements[i].type == "text") textString += "- " + rootElements[i].content + "\n";					
							else {
								if (rootElements[i].title.trim().length > 0) textString += "- " + rootElements[i].title + ": [Image]\n";
								else textString += "- [Image]\n";
							}

							// we need to recurse through children in order to build up the plain text structure
							if (rootElements[i].children.length > 0) {
								textString += appendDownloadChildren(req.params.id,rootElements[i].children,cards,0,"text");
							}
						}

						res.setHeader('Content-disposition', 'attachment; filename=' + board.title + ".txt");
					  	res.setHeader('Content-type', "text/plain");
						res.send(textString);
					}
					else if(req.params.format == "opml") {
						// this is an OPML structure so build the return document with OPML syntax
						var opmlString = "<?xml version=\"1.0\"?><opml version=\"2.0\"><head><ownerEmail>" + board.owner.email + "</ownerEmail></head><body>";
						
						for (var i=0; i<rootElements.length; i++) {
							if (!rootElements[i].parentId) {
								if (rootElements[i].type == "text") opmlString += "<outline text=\"" + rootElements[i].content + "\">";							else {
									if (rootElements[i].title.trim().length > 0) {
										opmlString += "<outline text=\"" + rootElements[i].title + ": [Image]\">";
									}
									else opmlString += "<outline text=\"[Image]\">";
								}

								// we need to recurse through children to build up the OTML structure
								if (rootElements[i].children.length > 0) {
									opmlString += appendDownloadChildren(req.params.id,rootElements[i].children,cards,0,"opml");
								}					
								opmlString += "</outline>";
							}	
						}

						opmlString += "</body></opml>";

						res.setHeader('Content-disposition', 'attachment; filename=' + board.title + ".opml");
					  	res.setHeader('Content-type', "text/xml");
						res.send(opmlString);
					}
				});
			}
    		else {
				dataError.log({
					model: __filename,
					action: "getImage",
					msg: "Invalid board authentication",
					res: res
				});
    		}
		}
		else {
			dataError.log({
				model: __filename,
				action: "getImage",
				msg: "Error finding board " + req.params.id,
				res: res
			});
		}
	});
}

// ===== This is used to recurse through the cluster structure of the board when building an export
function appendDownloadChildren(boardId,childNodes,allNodes,depth,format) {
	var currentDepth = depth+1;
	var returnString = "";

	// loop through all the nodes passed into the function
	for (var j=0, allNodesLength = allNodes.length; j<allNodesLength; j++) {
		// loop through all the child nodes of the parent node that called the recursive function
		for (var i = 0, childNodesLength = childNodes.length; i < childNodesLength; i++) {
			// check if this node belongs to tbe parent node
			if (childNodes[i].toString() == allNodes[j]._id.toString()) { 
				if (format == "html") {
					// this is an HTML export so build out the li structure 

					if (allNodes[j].type == "text") {
						returnString += "<li>" + allNodes[j].content + "</li>";
					}
					else {
						if (allNodes[j].title.trim().length > 0) returnString += "<li><img src=\"" + config.url + "/boards/cards/image/" + boardId + "/" + allNodes[j]._id + "\" /><br/>" + allNodes[j].title + "</li>";
						else returnString += "<li><img src=\"" + config.url + "/boards/cards/image/" + boardId + "/" + allNodes[j]._id + "\" /></li>";
					}

					// check if this node has children, if so then recurse further
					if (allNodes[j].children.length > 0) {
						returnString += "<ul>";
						returnString += appendDownloadChildren(boardId,allNodes[j].children,allNodes,currentDepth,"html");
						returnString += "</ul>";
					}
				}
				else if (format == "text") {
					// this is a plain text export. build up the structure. Use tabs to represent depth

					for (var k=0; k<currentDepth; k++) {
						returnString += "\t";
					}

					if (allNodes[j].type == "text") {
						returnString += "- " + allNodes[j].content + "\n";
					}
					else {
						if (allNodes[j].title.trim().length > 0) returnString += "- " + allNodes[j].title + ": [Image]\n";
						else returnString += "- [Image]\n";
					}

					// keep recursing
					returnString += appendDownloadChildren(boardId,allNodes[j].children,allNodes,currentDepth,"text");
				}
				else if (format == "opml") {
					// this is an OPML export so 

					if (allNodes[j].type == "text") {
						returnString += "<outline text=\"" + allNodes[j].content + "\">";
					}
					else {
						if (allNodes[j].title.trim().length > 0) returnString += "<outline text=\"" + allNodes[j].title + ": [Image]\">";
						else returnString += "<outline text=\"[Image]\">";
					}

					// check if there are any children. if so, keep recursing
					if ((allNodes[j].children) && (allNodes[j].children.length > 0)) returnString += appendDownloadChildren(boardId,allNodes[j].children,allNodes,currentDepth,"opml");
					
					returnString += "</outline>";
				}
				break;
			}
		}
	};
	
	return returnString;
} */