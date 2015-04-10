var Workspace = require(config.workspaceModel),
	Board = require(config.boardModel),
	Card = require(config.cardModel);

// ===== Actions for updating a cluster (this also covers creating a cluster as clusters are just a relationship between 2 cards)
exports.update = function (req, res) {
	var cookies = utils.parseCookies(req);
	
	Board
	.findById(req.params.boardId)
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
        else if (board) {
			// Check if this board is private and if so check this user has access
    		if ((!board.isPrivate)||
    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
				// check if this is updating the details of a cluster or actually craeting one
				if (req.body.action.trim().toLowerCase() == "create") {
					// we're intending to create a new cluster
					// retrieve all of a boards cards
					Card
					.find({ board: board._id })
					.exec(function(err, cards) {
						for (var i=0, cardsLength = cards.length; i<cardsLength; i++) {
							// sanity check that there is actually a card in the selected position
							if (cards[i]) {
								var updateCard = false;

								// check if this is the card that we want to be the parent of the cluster
								if (cards[i]._id == req.params.clusterId) {
									cards[i].collapsed = false;
									cards[i].isVoting = false;
									cards[i].children = [];

									// this is the parent cluster so we need to define it's child cards
									for (var j=0, clientCardsLength = req.body.cards.length; j<clientCardsLength; j++) {
										cards[i].children.push(req.body.cards[j].id)
									}

									updateCard = true;
								}

								// loop through all the cards that were defined as the children to this new cluster
								for (var j=0, specifiedChildCardLength = req.body.cards.length; j<specifiedChildCardLength; j += 1) {
									// check if the current board card we're looking at is one of the cards we want to be child to the new cluster
									if (cards[i]._id == req.body.cards[j].id) {
										// this IS one of the cards to be a child in the new cluster so check whether it currently has any dot vote 
										if (cards[i].votesReceived > 0) {
											// transfer the votes reeived into the syntax we use to define votes in a none clustered card.
											// this might seem counter intuative but we when it get attached on the front end this will get re-converted to votes
											if (cards[i].type.trim().toLowerCase() == "text") {
												cards[i].content = cards[i].content + " (+" + cards[i].votesReceived + ")";
											}
											else {
												cards[i].title = cards[i].title + " (+" + cards[i].votesReceived + ")";
											}

											cards[i].votesReceived = 0;
										}

										// set the parent of this card to new cluster we're creating
										cards[i].parentId = req.params.clusterId;
										cards[i].zPos = 1;
										
										if (cards[i].parentId) cards[i].collapsed = true;
										else cards[i].collapsed = false;

										updateCard = true;
									}
										
									// if we're not the card that we are turning into a cluster we want go through and remove any links it has to the children of the new cluster.
									// a card can only belong to one cluster and so we're making sure this is enforced here
									if (cards[i]._id != req.params.clusterId) {
										for (var k = 0, childCardLength = cards[i].children.length; k < childCardLength; k++) {
											if (cards[i].children[k] == req.body.cards[j].id) {
												cards[i].children.splice(k,1);

												updateCard = true;
											}
										};
									}
								}

								// check whether any changes were made to the board card we're looking at
								if (updateCard) {
									// update the timestamp of when the board was last updated
									board.lastModified = new Date();
									board.save();

									cards[i].save(function(err) {
										if (err) {
											dataError.log({
												model: __filename,
												action: "update",
												code: 500,
												msg: "Error saving card: " + cards[i]._id,
												err: err
											});
										}
									});
								}

							}
						}
					});

					res.send({ code: 200 });
				} 
				else if (req.body.action.trim().toLowerCase() == "update") {
					// this is an update to the details of an exisiting cluster
					Card
					.findById(req.params.clusterId)
					.exec(function(err, cluster) {
						if (err) {
							dataError.log({
								model: __filename,
								action: "update",
								code: 500,
								msg: "Error saving cluster " + req.params.clusterId,
								err: err,
								res: res
							});
						}
						else if (cluster) {
							// update the selected details of the cluster

							if (req.body.title) cluster.title = req.body.title;

							if (req.body.content) cluster.content = req.body.content;

							if (req.body.color) cluster.color = req.body.color;

							cluster.save(function(err) {
								if (err) {
									dataError.log({
										model: __filename,
										action: "update",
										code: 500,
										msg: "Error saving cluster " + req.params.clusterId,
										err: err,
										res: res
									});
								}
								else {
									board.lastModified = new Date();
									board.save();

									res.send({ code: 200 });
								}
							});
						}
						else {
							dataError.log({
								model: __filename,
								action: "update",
								code: 404,
								msg: "Unable to find cluster " + req.params.clusterId,
								err: err,
								res: res
							});
						}
					});
				}
			}
    		else {
				dataError.log({
					model: __filename,
					action: "update",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
   		}
        else {
        	dataError.log({
				model: __filename,
				action: "update",
				code: 404,
				msg: "Unable to find board " + req.params.boardId,
				res: res
			});
        }
   	});
};

// ===== Sets that this cluster should render itself as expanded on the front end
exports.expand = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "expand",
				code: 500,
				msg: "Error getting board",
				err: err,
				res: res
			});
        }
        else if (board != null) {
			// Check if this board is private and if so check this user has access
    		if ((!board.isPrivate)||
    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
				// retrieve the card that is the parent of this cluster
				Card
				.findById(req.params.clusterId)
				.exec(function(err, cluster) {
					if (err) {
						dataError.log({
							model: __filename,
							action: "expand",
							code: 500,
							msg: "Error retrieving cluster " + req.params.clusterId,
							err: err,
							res: res
						});
					}
					else if (cluster) {
						// set the this cluster as expanded

						cluster.collapsed = false;

						cluster.save(function(err) {
							if (err) {
					        	dataError.log({
									model: __filename,
									action: "expand",
									code: 500,
									msg: "Unable to save cluster " + req.params.clusterId,
									err: err
								});
							}
							else {
								// update the last modified timestamp on the board
								board.lastModified = new Date();
								board.save();

								res.send({ code: 200 });
							}
						});
			   		}
			        else {
			        	dataError.log({
							model: __filename,
							action: "expand",
							code: 404,
							msg: "Unable to find cluster " + req.params.clusterId,
							res: res
						});
			        }
				});
			}
    		else {
				dataError.log({
					model: __filename,
					action: "expand",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
        }
        else {
        	dataError.log({
				model: __filename,
				action: "expand",
				code: 404,
				msg: "Unable to find board " + req.params.boardId,
				res: res
			});
        }
   	});
};

// ===== Sets that this cluster should render itself as collapsed on the front end
exports.collapse = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
        if (err) {
	        dataError.log({
				model: __filename,
				action: "collapse",
				code: 500,
				msg: "Error getting board",
				err: err,
				res: res
			});
        }
        else if (board != null) {
			// Check if this board is private and if so check this user has access
    		if ((!board.isPrivate)||
    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
				// retrieve the card that is the parent of this cluster
				Card
				.findById(req.params.clusterId)
				.exec(function(err, cluster) {
					if (err) {
						dataError.log({
							model: __filename,
							action: "collapse",
							code: 500,
							msg: "Error retrieving cluster " + req.params.clusterId,
							err: err,
							res: res
						});
					}
					else if (cluster) {
						// set the cluster as collapsed

						cluster.collapsed = true;

						cluster.save(function(err) {
							if (err) {
					        	dataError.log({
									model: __filename,
									action: "collapse",
									code: 500,
									msg: "Unable to save cluster " + req.params.clusterId,
									err: err,
									res: res
								});
							}
							else {
								board.lastModified = new Date();
								board.save();

								res.send({ code: 200 });
							}
						});
			   		}
			        else {
			        	dataError.log({
							model: __filename,
							action: "collapse",
							code: 404,
							msg: "Unable to find cluster " + req.params.clusterId,
							res: res
						});
			        }
				});
			}
    		else {
				dataError.log({
					model: __filename,
					action: "collapse",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
        }
        else {
        	dataError.log({
				model: __filename,
				action: "collapse",
				code: 404,
				msg: "Unable to find board " + req.params.boardId,
				res: res
			});
        }
   	});
};

// ===== Set the cluster as having dot voting enabled
exports.startDotVoting = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "startDotVoting",
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
				// retrieve the card that is the parent of this cluster
				Card
				.findById(req.params.clusterId)
				.exec(function(err, cluster) {
					if (cluster) {
						// set the cluster as now dot voting
						cluster.isVoting = true;

						// we need to go through the chldren of this cluster and check if they contain the syntax specifiying previous votes
						Card
						.find({ parentId: req.params.clusterId })
						.exec(function(err, cards) {
							for (var i=0, cardsLength=cards.length; i<cardsLength; i++) {
								if (cards[i]) {
									var voteCountMatches = [];

					  				if (cards[i].type.trim().toLowerCase() == "text") {
										// this is a text card and therefore the text will be in the content field
					  					voteCountMatches = cards[i].content.match(/ \(\+(.*?)\)/g);

					  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = cards[i].content.match(/\(\+(.*?)\)/g);
									}
					  				else {
					  					// this is an image card and therefore the text will be in the title field, content is the image file name on amazon bucket
					  					voteCountMatches = cards[i].title.match(/ \(\+(.*?)\)/g);

					  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = cards[i].title.match(/\(\+(.*?)\)/g);
					  				}

					  				// we have some child cards that do have the syntax for votes
									if ((voteCountMatches != null) && (voteCountMatches.length > 0)) {

										// we need to update the correct field based on if this is a text or image card
					  					if (cards[i].type.trim().toLowerCase() == "text") {
					  						Card.update({ _id: cards[i]._id}, {
											    content: cards[i].content.replace(voteCountMatches[0],""), 
											    votesReceived: voteCountMatches[0].trim().replace("(+","").replace(")","")
											}, function(err, numberAffected, rawResponse) {
												if (err) {
										        	dataError.log({
														model: __filename,
														action: "startDotVoting",
														code: 500,
														msg: "Unable to save card " + cards[i]._id,
														err: err
													});
												}
											});
					  					}
					  					else {
					  						Card.update({ _id: cards[i]._id}, {
											    title: cards[i].title.replace(voteCountMatches[0],""), 
											    votesReceived: voteCountMatches[0].trim().replace("(+","").replace(")","")
											}, function(err, numberAffected, rawResponse) {
												if (err) {
										        	dataError.log({
														model: __filename,
														action: "startDotVoting",
														code: 500,
														msg: "Unable to save card " + cards[i]._id,
														err: err
													});
												}
											});
										}
									}
								}
							}

							// save the changes to the cluster
							cluster.save(function(err) {
								if (err) {
						        	dataError.log({
										model: __filename,
										action: "startDotVoting",
										code: 500,
										msg: "Unable to save cluster " + req.params.clusterId,
										err: err,
										res: res
									});
								}
								else {
									// update the last modified timestamp on the board
									board.lastModified = new Date();
									board.save();

									res.send({ code: 200 });
								}
							});
						});
					}
					else {
						dataError.log({
							model: __filename,
							action: "startDotVoting",
							code: 404,
							msg: "Unable to find cluster " + req.params.clusterId,
							res: res
						});
					}
				});
			}
    		else {
				dataError.log({
					model: __filename,
					action: "startDotVoting",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
		}
        else {
        	dataError.log({
				model: __filename,
				action: "startDotVoting",
				code: 404,
				msg: "Unable to find board " + req.params.boardId,
				res: res
			});
        }
   	});
};

// ===== Set the cluster as having dot voting turned off
exports.stopDotVoting = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
        if (err) {
         	dataError.log({
				model: __filename,
				action: "stopDotVoting",
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
				Card
				.findById(req.params.clusterId)
				.exec(function(err, cluster) {
					if (cluster) {
						// turn off the dot voting property of the cluster
						cluster.isVoting = false;

						// we need to loop through all of the children to this cluster and turn the votes into the "(+votesReceived)" syntax
						Card
						.find({ parentId: req.params.clusterId })
						.exec(function(err, cards) {
							for (var i=0, cardsLength = cards.length; i<cardsLength; i += 1) {
								// sanity check that there is a card there
								if (cards[i]) {
									// check if this card has received any votes
									if (cards[i].votesReceived > 0) {
										// this card has votes so turn the votes into the (+votesReceived) type syntax, e.. if it has 4 votes then append (+4) onto the cards text field
					      				if (cards[i].type.trim().toLowerCase() == "text") {
					      					// this is a text card so update the content field of the card
					  						Card.update({_id: cards[i]._id}, {
											    content: cards[i].content+ " (+" + cards[i].votesReceived + ")", 
											    votesReceived: 0
											}, function(err, numberAffected, rawResponse) {
												if (err) {
										        	dataError.log({
														model: __filename,
														action: "startDotVoting",
														code: 500,
														msg: "Unable to save card " + cards[i]._id,
														err: err
													});
												}
											});
					      				}
					      				else {
					      					// this is an image card so update the title field, the content field is the file name of the image in the amazon bucket
					  						Card.update({_id: cards[i]._id}, {
											    title: cards[i].title + " (+" + cards[i].votesReceived + ")", 
											    votesReceived: 0
											}, function(err, numberAffected, rawResponse) {
												if (err) {
										        	dataError.log({
														model: __filename,
														action: "startDotVoting",
														code: 500,
														msg: "Unable to save card " + cards[i]._id,
														err: err
													});
												}
											});
					      				}
				      				}
				      			}
							}

							// save the changes made to the cluster in the database
							cluster.save(function(err) {
								if (err) {
						        	dataError.log({
										model: __filename,
										action: "stopDotVoting",
										code: 500,
										msg: "Unable to save cluster " + req.params.clusterId,
										err: err,
										res: res
									});
								}
								else {
									board.lastModified = new Date();
									board.save();

									res.send({ code: 200 });
								}
							});
						});
					}
					else {
						dataError.log({
							model: __filename,
							action: "stopDotVoting",
							code: 404,
							msg: "Unable to find cluster " + req.params.clusterId,
							res: res
						});
					}
				});
			}
    		else {
				dataError.log({
					model: __filename,
					action: "stopDotVoting",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
   		}
        else {
        	dataError.log({
				model: __filename,
				action: "stopDotVoting",
				code: 404,
				msg: "Unable to find board " + req.params.boardId,
				res: res
			});
        }
   	});
};

// ===== Actions to delete a cluster from a board
exports.delete = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "delete",
				code: 500,
				msg: "Error getting board",
				err: err,
				res: res
			});
        }
        else if (board != null) {
			// Check if this board is private and if so check this user has access
    		if ((!board.isPrivate)||
    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
				// retrieve the card that we has specified as the parent to the cluster
				Card
				.findById(req.params.clusterId)
				.exec(function(err, cluster) {
					if (cluster) {
						var newChildren = [];

						// retrieve the child cards of this cluster
						Card
						.find({ parentId: req.params.clusterId })
						.exec(function(err, cards) {
							for (var i=0, childCardLength = cards.length; i<childCardLength; i++) {
								if (cards[i]) {
									// set the parent of this child to whatever parent of the cluster being deleted is (this could be null meaning it returns to being an unclustered card)
									newChildren.push(cards[i]._id);

									cards[i].parentId = cluster.parentId;

									cards[i].save(function(err) {
										if (err) {
											dataError.log({
												model: __filename,
												action: "delete",
												code: 500,
												msg: "Error saving child card of " + req.params.clusterId,
												err: err
											});
										}
							  		});
								}
							}

							// find the parent of the cluster being deleted as we need to add the new children
							Card
							.findById(cluster.parentId)
							.exec(function(err, parentCard) {
								// remove the cluster from the children of the parent
								for (var i=0, parentCardChildLength=parentCard.children.length; i<parentCardChildLength; i+=1) {
									if (parentCard.children[i] == cluster._id) {
										parentCard.children.splice(i,1);
									}
								}

								// add the children of the cluster to the parent of the cluster
								for (var j=0, newChildrenLength = newChildren.length; i<newChildrenLength; i++) {
									parentCard.children.push(newChildren[i]);
								}

								parentCard.save(function(err) {
									if (err) {
										dataError.log({
											model: __filename,
											action: "delete",
											code: 500,
											msg: "Error updating parent card of " + req.params.clusterId,
											err: err,
											res: res
										});
									}
									else { 
										// remove the  cluster card from the database
										cluster.remove();

										cluster.save(function(err) {
											if (err) {
												dataError.log({
													model: __filename,
													action: "delete",
													code: 500,
													msg: "Error updating parent card of " + req.params.clusterId,
													err: err,
													res: res
												});
											}
											else {
												// udpate the last modified timestamp for the baord
												board.lastModified = new Date();
												board.save();

												res.send({ code: 200 });
											}
										});
									}
						  		});
							});
						});
					}
					else {
						dataError.log({
							model: __filename,
							action: "delete",
							code: 404,
							msg: "Unable to find the cluster " + req.params.clusterId,
							res: res
						});
					}
				});
			}
    		else {
				dataError.log({
					model: __filename,
					action: "delete",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
		}
        else {
        	dataError.log({
				model: __filename,
				action: "delete",
				code: 404,
				msg: "Unable to find board " + req.params.boardId,
				res: res
			});
        }
   	});
};

// ===== Attach a card to a selected cluster
exports.attachCard = function (req, res) {
	var cookies = utils.parseCookies(req);
	
	Board
	.find({ workspace: req.params.workspaceId })
	.exec(function(err, boards) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "attachCard",
				code: 500,
				msg: "Error retrieving board",
				err: err,
				res: res
			});
		}
		else if (boards) {
			for (var i=0, boardsLength=boards.length; i<boardsLength; i++) {
				var board = boards[i];

				// Check if this board is private and if so check this user has access
	    		if ((!board.isPrivate)||
	    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
	    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
					// retrieve all the cards for a board
					Card
					.find({ board: board._id })
					.exec(function(err, cards) {
						var parentIndex = null,
							childIndex = null;

						// loop through the cards in the board. we need to create a relationship between the cluster being attached to and the new child card
						for (var j=0, cardsLength=cards.length; j<cardsLength; j+=1) {
							// sanity check that there is a card
							if (cards[j]) {
								if (cards[j]._id.toString() == req.params.clusterId) {
									// if this is the cluster that the new card is being attached to then add the new child card to its list of children
									cards[j].children.push(req.params.cardId);
									parentIndex = j;
								}
								else if (cards[j]._id.toString() == req.params.cardId) {
									// if this is the card we want to make a child then set it's parent id to the cluster
									cards[j].parentId = req.params.clusterId;
									childIndex = j;
								}
								
								// make sure that the card we are attaching isn't the child of another cluster and if so remove that clusters relationship to it
								if (cards[j]._id != req.params.clusterId) {
									for (var k=0, cardsChildrenLength=cards[j].children.length; k<cardsChildrenLength; k+=1) {
										if (cards[j].children[k] == req.params.cardId) cards[j].children.splice(j,1);
									};
								}
							}
						}

						// we've made  a new parent child relationship so we need to handle he change of there being dot voting on this cluster
						if ((parentIndex != null) && (childIndex != null)) {
							if (cards[parentIndex].isVoting) {
								// we are dot voting on this cluster so we need to check if this cards text contains the existing votes syntax i.e. (+votesReceived)
								var existingVotes = 0,
									voteCountMatches = [];

				  				if (cards[childIndex].type.trim().toLowerCase() == "text") {
				  					voteCountMatches = cards[childIndex].content.match(/ \(\+(.*?)\)/g);

				  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = cards[childIndex].content.match(/\(\+(.*?)\)/g);
								}
				  				else {
				  					voteCountMatches = cards[childIndex].title.match(/ \(\+(.*?)\)/g);

				  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = cards[childIndex].title.match(/\(\+(.*?)\)/g);
				  				}

								if ((voteCountMatches != null) && (voteCountMatches.length > 0)) {
									existingVotes = voteCountMatches[0].trim().replace("(+","").replace(")","");

				  					if (cards[childIndex].type.trim().toLowerCase() == "text") cards[childIndex].content = cards[childIndex].content.replace(voteCountMatches[0],"");
				  					else cards[childIndex].title = cards[childIndex].title.replace(voteCountMatches[0],"");
								}

				      			cards[childIndex].votesReceived += parseInt(existingVotes);
			      			}
			      			else {
			      				// we're not dot voting on this cluster so we need to convert any votes this card had previously received into the (+votesReceived) syntax
								if (cards[childIndex].votesReceived > 0) {
									if (cards[childIndex].type.trim().toLowerCase() == "text") cards[childIndex].content = cards[childIndex].content + " (+" + cards[childIndex].votesReceived + ")";
									else cards[childIndex].title = cards[childIndex].title + " (+" + cards[childIndex].votesReceived + ")";

									cards[childIndex].votesReceived = 0;
								}
			      			}

							cards[childIndex].zPos = cards[parentIndex].children.length;
						}

						for (var j=0, cardsLength=cards.length; j<cardsLength; j+=1) {
							if (cards[j]) {
								cards[j].save(function(err) {
									if (err) {
										dataError.log({
											model: __filename,
											action: "attachCard",
											code: 500,
											msg: "Error saving card",
											err: err
										});
									}
								});
							}
						}
					});
				}
	    		else {
					dataError.log({
						model: __filename,
						action: "attachCard",
						code: 401,
						msg: "Invalid board authentication"
					});
	    		}

				// update the last modified date timestamp for this board
				board.lastModified = new Date();
				board.save();
	    	}

			res.send({ code: 200 });
		}
		else {
			dataError.log({
				model: __filename,
				action: "attachCard",
				code: 404,
				msg: "Error finding board " + req.params.boardId,
				res: res
			});
		}
	});
};

// ===== Remove a card from a selected cluster
exports.detachCard = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "detachCard",
				code: 500,
				msg: "Error retrieving board",
				err: err,
				res: res
			});
		}
		else if (board) {
			// Check if this board is private and if so check this user has access
    		if ((!board.isPrivate)||
    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
				// retrieve all the cards for a board
				Card
				.find({ board: board._id })
				.exec(function(err, cards) {
					var boardUpdated = false;

					for (var i = 0, cardsLength = cards.length; i < cardsLength; i += 1) {
						// sanity check the card exists
						if (cards[i]) {
							var cardUpdated = false;

							// check if this card is the cluster we want to detach the card from
							if (cards[i]._id.toString() == req.params.clusterId) {
								// loop through the children of this cluster to find the card we want to remove
								for (var j=0, cardsChildrenLength = cards[i].children.length; j<cardsChildrenLength; j++) {
									if (cards[i].children[j] == req.params.cardId) cards[i].children.splice(j,1);
								}

								// if this cluster no long has any children then its now actually back to be a card so turn of dotvoting
								if (cards[i].children.length === 0) cards[i].isVoting = false;
							
								cardUpdated = true;
							}

							// if this card is the one we want to detach
							if (cards[i]._id.toString() == req.params.cardId) {
								// set the votes this card has received to zero and convert any votes it has into the (+votesReceived) notation
				      			if (cards[i].votesReceived > 0) {
				      				if (cards[i].type.trim().toLowerCase() == "text") cards[i].content = cards[i].content + " (+" + cards[i].votesReceived + ")";
				      				else cards[i].title = cards[i].title + " (+" + cards[i].votesReceived + ")";
				      			}

				      			// set all its properties back to that of a vanilla card without a parent
								cards[i].parentId = null;
								cards[i].votesReceived = 0;
								cards[i].width = null;
								cards[i].height = null;
								cards[i].xPos = req.body.xPos;
								cards[i].yPos = req.body.yPos;
								cards[i].zPos = null;

								cardUpdated = true;
							}

							if (cardUpdated) {
								boardUpdated = true;

								// save the updated card
								cards[i].save(function(err) {
									if (err) {
										dataError.log({
											model: __filename,
											action: "detachCard",
											code: 500,
											msg: "Error saving card",
											err: err
										});
									}
								});
							}
						}
					}

					if (boardUpdated) {
			        	board.lastModified = new Date();
						board.save();
					}
					
					res.send({ code: 200 });
				});
			}
    		else {
				dataError.log({
					model: __filename,
					action: "detachCard",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
		}
		else {
			dataError.log({
				model: __filename,
				action: "detachCard",
				code: 404,
				msg: "Error finding board " + req.params.boardId,
				res: res
			});
		}
	});
};

// ===== Actions to take a cluster previously attached to another cluster back to the main board
exports.attachClusterToMain = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.find({ workspace: req.params.workspaceId })
	.exec(function(err, boards) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "attachClusterToMain",
				code: 500,
				msg: "Error retrieving board",
				err: err,
				res: res
			});
		}
		else if (boards) {
			for (var i=0, boardsLength=boards.length; i<boardsLength; i++) {
				var boardUpdated = false,
					board = boards[i];

				// Check if this board is private and if so check this user has access
	    		if ((!board.isPrivate)||
	    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
	    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
					Card
					.find({ board: board._id })
					.exec(function(err, cards) {
						for (var j=0, cardsLength=cards.length; j<cardsLength; j+=1) {
							// sanity check that we have a card
							if (cards[j]) {
								var cardUpdated = false;

								// search through all the current cards children for any cards that have the selected cluster as a child and remove that relationship
								for (var k=0, cardsChildrenLength = cards[j].children.length; k<cardsChildrenLength; k+=1) {
									if (cards[j].children[k] == req.params.clusterId) {
										cards[j].children.splice(k, 1);
										
										cardUpdated = true;
									}
								}

								// check if this is the cluster we want to return to the main board
								if (cards[j]._id.toString() == req.params.clusterId) {
									// check if this cluster has received any votes as part of a dot vote and put them into the (+votesReceived) notationn
									if (cards[j].votesReceived > 0) {
										if (cards[j].type.trim().toLowerCase() == "text") cards[j].content = cards[j].content + " (+" + cards[j].votesReceived + ")";
										else cards[j].title = cards[j].title + " (+" + cards[j].votesReceived + ")";

										cards[j].votesReceived = 0;
									}

									// set the details of this cluster to being a vanilla unattached cluster
									cards[j].parentId = null;
									cards[j].xPos = req.body.xPos;
									cards[j].yPos = req.body.yPos;
									cards[j].collapsed = false;

									if (cards[j].board.toString() != req.params.boardId) updateCardBoard(cards[j]._id, req.params.boardId);

									cardUpdated = true;
								}

								if (cardUpdated) {
									boardUpdated = true;

									cards[j].save(function(err) {
										if (err) {
											dataError.log({
												model: __filename,
												action: "attachClusterToMain",
												code: 500,
												msg: "Error saving card",
												err: err
											});
										}
									});
								}
							}
						}
					});
				}
	    		else {
					dataError.log({
						model: __filename,
						action: "attachClusterToMain",
						code: 401,
						msg: "Invalid board authentication"
					});
	    		}

				if (boardUpdated) {
					// update the last modified timestamp for this board
		        	board.lastModified = new Date();
					board.save();
				}
	    	}
			
			res.send({ code: 200 });
		}
		else {
			dataError.log({
				model: __filename,
				action: "attachClusterToMain",
				code: 404,
				msg: "Error finding board " + req.params.boardId,
				res: res
			});
		}
	});
};

// ===== Actions to attach one cluster to another cluster
exports.attachCluster = function (req, res) {
	var cookies = utils.parseCookies(req);
	
	Board
	.find({ workspace: req.params.workspaceId })
	.exec(function(err, boards) {
		if (err) { 
			dataError.log({
				model: __filename,
				action: "attachCluster",
				code: 500,
				msg: "Error retrieving board",
				err: err,
				res: res
			});
		}
		else if (boards) {
			for (var i=0, boardsLength=boards.length; i<boardsLength; i++) {
				var board = boards[i];
			
				// Check if this board is private and if so check this user has access
	    		if ((!board.isPrivate)||
	    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
	    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
					// retrieve all the cards for this board
					Card
					.find({ board: board._id })
					.exec(function(err, cards) {
						var parentIndex = null;
						var childIndex = null;

						// loop through all the cards in this boards
						for (var j=0, cardsLength=cards.length; j<cardsLength; j+=1) {
							// sanity check that there is a card
							if (cards[j]) {
								// loop through all the the childre of the current card and remove any child relationships to the cluster we want to attach to another cluster
								for (var k=0, cardsChildrenLength=cards[j].children.length; k<cardsChildrenLength; k+=1) {
									if (cards[j].children[j] == req.params.childclusterId) cards[j].children.splice(k, 1);
								}

								if (cards[j]._id.toString() == req.params.parentclusterId) {
									// if this is if the card that we want to be the parent of the cluster we are attaching then create the relationship to the child cluster
									cards[j].children.push(req.params.childclusterId);
									parentIndex = i;
								}
								else if (cards[j]._id.toString() == req.params.childclusterId) {
									// if this is the child cluster then collapse it (as clusters go into another cluster collapsed) and create the relationship to the parent
									cards[j].collapsed = true;
									cards[j].parentId = req.params.parentclusterId;
									childIndex = i;
								}
							}
						}

						// we've created the parent child relationship and so we need to sort out any dot voting stuff
						if ((parentIndex != null) && (childIndex != null)) {
							if (cards[parentIndex].isVoting) {
								// the parent cluster is voting so we need to convert previous votes store on the card in the (+votesReceived) syntax to actual votes
								var existingVotes = 0; 
								var voteCountMatches = [];

				  				if (cards[childIndex].type.trim().toLowerCase() == "text") {
				  					voteCountMatches = cards[childIndex].content.match(/ \(\+(.*?)\)/g);
				  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = cards[childIndex].content.match(/\(\+(.*?)\)/g);
								}
				  				else {
				  					voteCountMatches = cards[childIndex].title.match(/ \(\+(.*?)\)/g);
				  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = cards[childIndex].title.match(/\(\+(.*?)\)/g);
				  				}

								if ((voteCountMatches != null) && (voteCountMatches.length > 0)) {
									existingVotes = voteCountMatches[0].trim().replace("(+","").replace(")","");

				  					if (cards[childIndex].type.trim().toLowerCase() == "text") cards[childIndex].content = cards[childIndex].content.replace(voteCountMatches[0],"");
				  					else cards[childIndex].title = cards[childIndex].title.replace(voteCountMatches[0],"");
								}

				      			cards[childIndex].votesReceived += parseInt(existingVotes);
			      			}
			      			else {
			      				// the parent cluster isn't dot voting so convert any votes stored on the cluster into the (+votes received syntax)
								if (cards[childIndex].votesReceived > 0) {
									if (cards[childIndex].type.trim().toLowerCase() == "text") cards[childIndex].content = cards[childIndex].content + " (+" + cards[childIndex].votesReceived + ")";
									else cards[childIndex].title = cards[childIndex].title + " (+" + cards[childIndex].votesReceived + ")";
									
									cards[childIndex].votesReceived = 0;
								}
			      			}

							cards[childIndex].zPos = cards[parentIndex].children.length;
						}

						// save the changes we've made to the cards structure
						for (var j=0, cardsLength=cards.length; j<cardsLength; j+=1) {
							if (cards[j]) {
								cards[j].save(function(err) {
									if (err) {
										dataError.log({
											model: __filename,
											action: "attachCluster",
											code: 500,
											msg: "Error saving card",
											err: err
										});
									}
								});
							}
						}

						// update the last modified time stamp for the board
			        	board.lastModified = new Date();
						board.save();
					});
				}
	    		else {
					dataError.log({
						model: __filename,
						action: "attachCluster",
						code: 401,
						msg: "Invalid board authentication"
					});
	    		}
	    	}
						
			res.send({ code: 200 });
		}
		else { 
			dataError.log({
				model: __filename,
				action: "attachCluster",
				code: 404,
				msg: "Error finding board " + req.params.boardId,
				res: res
			});
		}
	});
}

// ===== Actions to detach a cluster from it's parent cluster
exports.detachCluster = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.find({ workspace: req.params.workspaceId })
	.exec(function(err, boards) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "detachCluster",
				code: 500,
				msg: "Error retrieving board",
				err: err,
				res: res
			});
		}
		else if (boards) {
			for (var i=0, boardsLength=boards.length; i<boardsLength; i++) {
				var board = boards[i];
				
				// Check if this board is private and if so check this user has access
	    		if ((!board.isPrivate)||
	    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
	    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
					// retrieve all the cards for this board
					Card
					.find({ board: board._id })
					.exec(function(err, cards) {
						for (var j=0, cardsLength=cards.length; j<cardsLength; j+=1) {
							// sanity check we have a card
							if (cards[j]) {
								// check if this card is the parent to the cluster we are detaching. IF so then remove the cluster from its list of children
								if (cards[j]._id.toString() == req.params.parentclusterId) {
									for (var k=0, cardsChildrenLength = cards[j].children.length; k<cardsChildrenLength; k+=1) {
										if (cards[j].children[k] == req.params.childclusterId) cards[j].children.splice(k,1);
									}
								}

								// if this is the cluster we are attempting to detach then remove the relationship to a parent
								if (cards[j]._id.toString() == req.params.childclusterId) {
									cards[j].parentId = null;
									cards[j].zPos = null;
									cards[j].collapsed = false;
								}

								cards[j].save(function(err) {
									if (err) {
										dataError.log({
											model: __filename,
											action: "detachCluster",
											code: 500,
											msg: "Error saving card",
											err: err
										});
									}
								});
							}
						}

						// update the last modified time stamp for the current board
			        	board.lastModified = new Date();
						board.save();
					});
				}
	    		else {
					dataError.log({
						model: __filename,
						action: "detachCluster",
						code: 401,
						msg: "Invalid board authentication",
						res: res
					});
	    		}
	    	}
						
			res.send({ code: 200 });
		}
		else {
			dataError.log({
				model: __filename,
				action: "detachCluster",
				code: 404,
				msg: "Error finding board " + req.params.boardId,
				res: res
			});
		}
	});
}

// ===== Set the sort position of cards within a cluster
exports.sort = function (req, res) {
	var cookies = utils.parseCookies(req);;
	
	Board
	.findById(req.params.boardId)
	.exec(function(err, board) {
        if (err) {
        	dataError.log({
				model: __filename,
				action: "sort",
				msg: "Error getting bo",
				code: 500,
				err: err,
				res: res
			});
        }
		else if (board) {
    		if ((!board.isPrivate)||
    			((req.isAuthenticated()) && (board.owner.toString() == req.user._id.toString())) || 
    			(cookies["BoardThing_" + board._id + "_password"] != null) && (cookies["BoardThing_" + board._id + "_password"].trim() == board.password.trim())) {
	        	// check that this cluster does actually have child cards
	        	if ((req.body.cards) && (req.body.cards.length > 0)) {
	        		// retrieve all the child cards for the cluster
					Card
					.find({ parentId: req.params.clusterId })
					.exec(function(err, cards) {
						// loop through the order of cards as specified on the client
						for (var i=0, userCardsLength=req.body.cards.length; i<userCardsLength; i++) {
							// sanity check that there is a card id in the current position
							if (req.body.cards[i]) {
								// loop through all the child cards of the cluster
								for (var j=0, cardsLength = cards.length; j<cardsLength; j++) {
									// based on what position we are in the order sent from the client set the correct position
									if ((cards[j]) && (cards[j]._id == req.body.cards[i])) {
										cards[j].zPos = (i+1);
										
										cards[j].save(function(err) {
											if (err) {
												dataError.log({
													model: __filename,
													action: "sort",
													code: 500,
													msg: "Error saving card",
													err: err
												});
											}
										});
										break;
									}
								}
							}
						}

						// update the last modified time stamp for the current board
			        	board.lastModified = new Date();
						board.save();

						res.send({ code: 200 });
					});
				}
				else {
					res.send({ code: 200 });
				}
			}
    		else {
				dataError.log({
					model: __filename,
					action: "sort",
					code: 401,
					msg: "Invalid board authentication",
					res: res
				});
    		}
        }
		else {
			dataError.log({
				model: __filename,
				action: "sort",
				code: 404,
				msg: "Error finding board " + req.params.boardId,
				res: res
			});
		}
   	});
}

function updateCardBoard(cardId, boardId) {
	// retrieve the selected card
	Card
	.findById(cardId)
	.exec(function(err, card) {
		// set the cards board property to the selected board
		card.board = boardId;

		for (var i=0, cardChildrenLength=card.children.length; i<cardChildrenLength; i+=1) {
			updateCardBoard(card.children[i], boardId);
		}

		card.save(function(err) {
			if (err) {
				dataError.log({
					model: __filename,
					action: "setBoard",
					code: 500,
					msg: "Error saving card: " + cardId,
					err: err
				});
			}
  		});
	});
}