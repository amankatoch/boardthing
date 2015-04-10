define([
	"modules/card.services",
	"modules/cluster.services",
	"jquery",
    'jqueryUI',
    'touchpunch',
	"spectrum"
],

function(Card_Services, Cluster_Services) {
	var Card = {};
	
  	Card.Item = Backbone.View.extend({
    	tagName: "div",

    	_isMobile: null,
    	_workspace: null,
    	_parent: null,

    	_resizing: false,

    	// {{ Contructor }}

		initialize: function(options) {
			this.el.id = "card_" + this.model.id;

			this._isMobile = options.isMobile;
			this._workspace = options.workspace;
			this._parent = options.parent;
			
			this.model.workspaceId = this._workspace.getId();
		},

		// {{ Object Building }}

		render: function() {
			var that = this;
			
			var template = "/app/templates/card/item.html";
			if (this.model.parentId) template = "/app/templates/card/clusteredItem.html";

			$.get(template, function(contents) {
				that.$el.html(_.template(contents, that.model));

				that.afterRender();				

				that.unbind();
				that.bind();
			}, "text");
		},

	    afterRender: function() {
	    	var that = this;

			if (this.model.parentId) this.el.className = "box clustered-card-container";
			else this.el.className = "box card-container";

			_.defer(function() { 
	    		that.$el.attr("element-id", that.model.id);
	    		that.$el.attr("object-type", "card");

		    	// Figure out the the default card height and width is
				if (that.model.type.trim().toLowerCase() != "text") {
					if ((!that.$el.css("min-width")) && (!that.$el.css("min-height"))) {
						that.$el.css({ minWidth: that.$el.width() });
						that.$el.css({ minHeight: that.$el.height() });
					}
				}
				else {
					if ((!that.$el.css("min-width")) || (that.$el.css("min-width") == "0px")) {
						that.$el.css({ minWidth: 180 });
						that.$el.css({ minHeight: that.$el.height() });
					}
				}

				// Set the defined position
				if ((!that._parent) && ((that.model.xPos != null) && (that.model.yPos != null))) that.$el.css({top: that.model.yPos, left: that.model.xPos, position: 'absolute'});
					
				if ((!that._parent) && (that.model.zPos != null)) that.$el.zIndex(that.model.zPos);

				if ((that.model.width) || (that.model.height)) {
		    		that.$el.attr("is-resized", "true");

		    		if (that.model.width) that.$el.css({ width: that.model.width });
		    		else that.$el.css({ width: "" });

		    		if (that.model.height) that.$el.css({ height: that.model.height });
		    		else that.$el.css({ height: "" });
				}

				if (that.model.color) that.$el.css({ backgroundColor: that.model.color });

				if (that.model.isLocked) that.$el.addClass("locked");

				// Check that the height of the card also includes the text bar, this can get out of sync

				if (that.model.type.trim().toLowerCase() != "text") {
					that.$("#card-body-image_" + that.model.id).load(function() {
			    		if (that.$el.attr("is-resized") == "true") {
							var cardHeight = (that.$("#card-body-image_" + that.model.id).height() + 20);

			    			if ((that.model.title) && (that.model.title.trim().length > 0)) cardHeight = (that.$("#card-body-image_" + that.model.id).height() + 20 + that.$("#card-image-title").height() + 10);
			    			
			    			if (cardHeight != that.$el.height()) {
								that.$el.css("height", null );
								that.$el.css("height", cardHeight);

								that.saveCardSize(that.$el.width(), that.$el.height());
							}
						}
					}).attr("src", "/workspace/boards/cards/image/" + that._workspace.getId() + "/" + that.model.boardId + "/" + that.model.id + "?random=" + new Date().getTime());
				}

	    		if (that.$el.attr("is-resized") == "true") {
					if (that.model.type.trim().toLowerCase() == "text") {
						if ((that.$("#card-body-text").height() + 20) > that.$el.height()) {
							that.$el.css({ height: (that.$("#card-body-text").height() + 20) });

							that.saveCardSize(that.$el.width(), that.$el.height());
						}
					}
				}
		    });
	    },

		// {{ Event Binding }}

	    unbind: function() {
			if (!this._isMobile) {
				this.$el.unbind("click");
				this.$el.unbind("mouseup");
				this.$el.unbind("dblclick");
				this.$el.unbind("mouseover");
				this.$el.unbind("mouseout");

				this.$("#card-settings-button_" + this.model.id).unbind("click");
			}
			
			this.$el.unbind("draggable");
			this.$el.unbind("droppable");

			this.$("#card-resize-button").unbind("click");
			this.$("#card-lock-button").unbind("click");
			this.$("#undo-card-resize-button").unbind("click");
			this.$("#card-delete-button").unbind("click");
			this.$("#vote-container").unbind("click");
	    },

	    bind: function() {
	    	var that = this;

			if (this._isMobile) {
				// Bind mobile es (only need to be bound once and not per render)
				if (!this._mobileEventsBound) {
					var touchComplete = null;

	      			this.$el.click(function(e) {
	   					e.stopPropagation();
	   					e.preventDefault();
	      			});

					this.$el.on("touchstart touchend taphold", function(e) {
	   					e.stopPropagation();
	   					e.preventDefault();

	   					if (e.type.toString() == "touchstart") {
							touchComplete = function() {
		   						if (that._showSettingsIcon) that.clearSettingsmenu(e);
					        	else {
									if (that.model.isLocked) {
					        			that._workspace._dropPosition = { x: e.originalEvent.touches[0].pageX,  y: e.originalEvent.touches[0].pageY };
					        			that._workspace._cardsDroppedInPosition = 0;

										that._workspace.showAddCard();
									}
									else {		
										if ((e.target.id != "vote-container") && (e.target.id != "add-vote")) that.editItem(e);
							        }
							    }
							}
	   					}
	   					else if (e.type.toString() == "taphold") {
							if (!that._isDragging) {
								that.$("#card-action-container").show();
							
								that.showSettingsMenu(e);
							
								touchComplete = null;
							}
	   					}
	   					else if (e.type.toString() == "touchend") {
	   						if ((!that._isDragging) && (touchComplete != null)) touchComplete();
							else that._isDragging = false;

							touchComplete = null;

			    			if ((that._workspace.getSelectedPageTool() == "pen") || (that._workspace.getSelectedPageTool() == "eraser")) that._workspace.stopDrawing();
	   					}
					});
				}
			}
			else {
				this.$el.click(function(e) {
					e.stopPropagation();

					that.clearSettingsmenu(e);

					if (that._parent) that._parent.bubbleClearSettingsmenu();
				});

				this.$el.mouseup(function(e) {
					if ((that._workspace.getSelectedPageTool() == "pen") || (that._workspace.getSelectedPageTool() == "eraser")) that._workspace.stopDrawing();
				});

				this.$el.dblclick(function(e) {
					if (that.model.isLocked) {
	        			that._workspace._cardsDroppedInPosition = 0;

						that._workspace.showAddCard();
					}
					else {
						if ((e.target.id != "vote-container") && (e.target.id != "add-vote")) {
							that.editItem(e);
						}
					}
				});

				this.$el.mouseover(function(e) {
					that.showHoverIcons(e);
				});

				this.$el.mouseout(function(e) {
					that.hideHoverIcons(e);
				});

				this.$("#card-settings-button_" + this.model.id).click(function(e) {					
					if (that._parent) that._parent.bubbleClearSettingsmenu();

					that.showSettingsMenu(e);
				});
			}

			this.$("#card-resize-button").click(function(e) {
				that.resizeCard(e);
			});

			this.$("#card-lock-button").click(function(e) {
				that.lockCard(e);
			});

			this.$("#undo-card-resize-button").click(function(e) {
				that.undoResizing(e);
			});

			this.$("#card-duplicate-button").click(function(e) {
				that.duplicateCard(e);
			});

			this.$("#card-delete-button").click(function(e) {
				that.delete(e);
			});

			this.$("#vote-container").click(function(e) {
				that.addVote(e);
			});

			if (!that.model.isLocked) {
	        	var startPageX = null,
	        		startPageY = null,
	        		startDragX = null,
	        		startDragY = null;

	        	that.$el.draggable({
					start: function(e,ui) {
						that._isDragging = true;

					    startPageX = e.pageX;
					    startPageY = e.pageY;

					    if (that._parent) {
							startDragX = 0;
		        			startDragY = 0;
					    }
					    else {
							startDragX = that.$el.position().left;
		        			startDragY = that.$el.position().top;
					    }

						that.$el.zIndex(999999999);
					},
					drag: function(e,ui) {
						var zoom = that._workspace.getZoom();

				        ui.position.left = startDragX-(startPageX-e.pageX)/zoom;
				        ui.position.top = startDragY-(startPageY-e.pageY)/zoom;
					},
					stop: function(e,ui) {
						e.stopPropagation();

						that._isDragging = true;

						var zoom = that._workspace.getZoom();

				        ui.position.left = startDragX-(startPageX-e.pageX)/zoom;
				        ui.position.top = startDragY-(startPageY-e.pageY)/zoom;
        
						var totalParentOffset = { x:0, y: 0 };
						if (that._parent) totalParentOffset = that._parent.getTotalParentOffset();

						var targetBoard = that._workspace.checkBoardPosition((e.pageX/zoom) + that._workspace.getBoardScrollWidth(), (e.pageY/zoom) + that._workspace.getBoardScrollHeight());

						if (targetBoard) {
							var boardDistanceFromSource = that._workspace.getBoardDistanceFromSource(that.model.boardId, targetBoard.getId()),
								boardDistance = that._workspace.getBoardDistance(that.model.boardId, targetBoard.getId()),
								cardPosition = {
									x: that.$el.position().left + totalParentOffset.x,
									y: that.$el.position().top + totalParentOffset.y
								}, 
								mousePosition = {
									x: (e.pageX/zoom) + that._workspace.getBoardScrollWidth() - boardDistanceFromSource.x,
									y: (e.pageY/zoom) + that._workspace.getBoardScrollHeight() - boardDistanceFromSource.y
								};

							if (targetBoard.getId() != that.model.boardId) {
								if (that._parent) {
									cardPosition = {
										x: that.$el.position().left + totalParentOffset.x - boardDistance.x,
										y: that.$el.position().top + totalParentOffset.y - boardDistance.y
									};
								}
								else {
									cardPosition = {
										x: that.$el.position().left - boardDistance.x,
										y: that.$el.position().top - boardDistance.y
									};
								}
							}

							var elementId = that._workspace.checkPositionTaken(targetBoard.getId(), that.model.id, mousePosition.x, mousePosition.y),
								currentBoardId = that.model.boardId;

							that.model.boardId = targetBoard.getId();
							that.model.xPos = cardPosition.x;
							that.model.yPos = cardPosition.y;

				        	if (targetBoard.getId() != currentBoardId) {
								Card_Services.SetBoard(that._workspace.getId(), targetBoard.getId(), that.model.id);

						    	that._workspace.moveCardBoard(that.model.id, targetBoard.getId(), that.model.xPos, that.model.yPos);
				        	}

							if (elementId == -1) {
								if (that._parent) {
									that._parent.removeCard(that.model.id, {
										xPos: that.model.xPos,
										yPos: that.model.yPos
									});
							    	
									that.model.collapsed = false;

							    	that._workspace.addCardToBoard(that.model);
								}
								else {
							        that.updateCardPosition(that.model.xPos, that.model.yPos);
								    	
							    	that._workspace.sortZIndexes(that.model.id, true);
							    }
				        	}
				        	else {
				        		var entity = that._workspace.getBoardEntity(elementId);

								if (entity.getType() == "card") {
									if (!entity.getIsLocked()) that._workspace.setCardToCluster(targetBoard.getId(), that.model.id, elementId);
									else {
							        	that.updateCardPosition(that.model.xPos, that.model.yPos);
								    	
								    	that._workspace.sortZIndexes(that.model.id, true);
					        		}
					        	}
				        	}
					    }
				        else {
				        	if (that._parent) that.$el.css({top: 0, left: 0, position: "relative" });
				        	else that.$el.css({top: startDragY, left: startDragX, position: "absolute" });
				        }
					}
				});
	    	}

			this._mobileEventsBound = true;
	    },

	    // {{ Getters }}

	    getModel: function() {
	    	return this.model;
	    },

	    getId: function() {
	    	return this.model.id;
	    },

	    getBoardId: function() {
	    	return this.model.boardId;
	    },

	    getXPos: function() {
	    	return this.model.xPos;
	    },

	    getYPos: function() {
	    	return this.model.yPos;
	    },

	    getZPos: function() {
	    	return this.model.zPos;
	    },

	    getWidth: function() {
	    	return this.model.width;
	    },

	    getHeight: function() {
	    	return this.model.height;
	    },

	    getIsLocked: function() {
	    	return this.model.isLocked;
	    },

	    getType: function() {
	    	return "card";
	    },

	    // {{ Setters }}

	    setBoardId: function(boardId) {
	    	this.model.boardId = boardId;
	    },

	    setXPos: function(value) {
	    	this.model.xPos = value;

	    	this.$el.css({ left: this.model.xPos, position: 'absolute' });
	    },

	    setYPos: function(value) {
	    	this.model.yPos = value;

	    	this.$el.css({ top: this.model.yPos, position: 'absolute' });
	    },

	    setZPos: function(value) {
	    	this.model.zPos = value;
	    },

	    setHidden: function() {
	    	this.$el.hide();
	    },

	    setVisible: function() {
	    	this.$el.show();
	    },

	    // {{ Public Methods }}

		// ********** Actions for displaying edit icons **********

		showHoverIcons: function (e) {
			e.stopPropagation();

			this.$("#card-action-container_" + this.model.id).show();
		},

	    hideHoverIcons: function(e) {
	    	if (!this._showSettingsIcon) this.$("#card-action-container_" + this.model.id).hide();
	    },

		// ********** Actions for displaying the settings menu **********

		showSettingsMenu: function(e) {
			e.stopPropagation();

			if (!this.$("#card-settings-menu_" + this.model.id).is(':visible')) {
				this._showSettingsIcon = true;

				if (this._isMobile) this.$("#card-resize-button").hide();

				this.$("#card-settings-menu_" + this.model.id).show();
			}
			else this.clearSettingsmenu();
		},

		bubbleClearSettingsmenu: function() {
			this.clearSettingsmenu();

			if (this._parent) this._parent.bubbleClearSettingsmenu();
		},

		clearSettingsmenu: function() {
			this._showSettingsIcon = false;

			this.$("#card-settings-menu_" + this.model.id).hide();
			this.$("#card-action-container_" + this.model.id).hide();
		},

		// ********** Actions for setting card position **********

		setCardPosition: function(cardId,left,top) { 
			if (this.model.id == cardId) {
				this.model.xPos = left;
				this.model.yPos = top;

				this.render();
			}	
		},

		updateCardPosition: function(left,top) {
			var that = this;

			Card_Services.UpdatePosition(this._workspace.getId(), this.model.boardId, this.model.id, left, top, function() {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"updateCardPosition", 
					workspace: that._workspace.getId(),
					card: {
			        	id: that.model.id,
			        	boardId: that.model.boardId,
			        	xPos: left,
			        	yPos: top
			        } 
				}));
			});
		},

		// ********** Actions to edit a card **********

		editItem: function(e) {
			e.stopPropagation();

			this.stopCardResize();

			this._workspace.showEditCard(this.model);
		},

		updateCardContent: function(cardId,content,title,color) {
			if (this.model.id == cardId) {
				var cardUpdated = false;

				if (content) this.model.content = content;

				if (title) this.model.title = title;

				if (color) this.model.color = color;

				if ((content) || (title) || (color)) cardUpdated = true;

				if (cardUpdated) this.render();
			}
		},

		// ********** Actions to resize a card **********

		resizeCard: function(e) {
			e.stopPropagation();

			var that = this;

			this.clearSettingsmenu();

			this.$("#card-resize-button").hide();

			if(this.model.parentId == null) {
				var currentWidth = this.$el.width(),
					currentHeight = this.$el.height(),
					lastX = null;

				this._resizing = true;

				this.$el.addClass("resizing-content");

				if (this.model.type.trim().toLowerCase() == "text") this.$el.append("<div id=\"resize-right\" class=\"resize-right\"></div><div id=\"resize-left\" class=\"resize-left\"></div><div id=\"resize-top\" class=\"resize-top\"></div><div id=\"resize-bottom\" class=\"resize-bottom\"></div>");
				else this.$el.append("<div id=\"resize-top-right\" class=\"resize-top-right\"></div><div id=\"resize-top-left\" class=\"resize-top-left\"></div><div id=\"resize-bottom-right\" class=\"resize-bottom-right\"></div><div id=\"resize-bottom-left\" class=\"resize-bottom-left\"></div>");
			
				try {
					this.$el.resizable( "destroy" );
				}
				catch(err) {}

	    		this.$el.resizable({
	    			handles: "n,s,e,w",
	    			resize: function(e,ui) {
	    				that.$("#undo-card-resize-button").show();

	    				if (that.model.type.trim().toLowerCase() != "text") {

						}
						else {
							if (that.$el.height() < (that.$("#card-body-text").height() + 20)) that.$el.css({ height: that.$("#card-body-text").height() + 20 });	
						}

	    				if (that.$el.width() == 180) that.$el.css({ left: lastX });

	    				lastX = that.$el.position().left;
	    			}
				});
			}
		},

		// Called when the resize is finished

		stopCardResize: function() {
			if (this._resizing) {
				this.removeResizeStyling();

	        	var isStartSize = false;

				if (this.model.type.trim().toLowerCase() != "text") {
					if (((this.$el.width() + "px") == this.$el.css("min-width")) && ((this.$el.height() + "px") == this.$el.css("min-height"))) isStartSize = true;
				}
				else {
					if (((this.$el.width() + "px") == this.$el.css("min-width")) && ((this.$el.height() + "px") == this.$el.css("min-height"))) isStartSize = true;
				}

				if (!isStartSize) {
					this.saveCardSize(this.$el.width(), this.$el.height());

		        	this.updateCardPosition((this.$el.position().left + this._workspace.getBoardScrollWidth()), (this.$el.position().top + this._workspace.getBoardScrollHeight()));
				}
				else this.saveUndoResizing();
			}
		},

		removeResizeStyling: function() {
			try {
				this.$el.resizable( "destroy" );
			}
			catch(err) {}

			this.$("#resize-left").remove();
			this.$("#resize-right").remove();
			this.$("#resize-top").remove();
			this.$("#resize-bottom").remove();

			this.$("#resize-top-left").remove();
			this.$("#resize-top-right").remove();
			this.$("#resize-bottom-left").remove();
			this.$("#resize-bottom-right").remove();

			this.$el.removeClass("resizing-content");

			this.$("#card-resize-button").show();

			this._resizing = false;
		},

		saveCardSize: function(width,height) {
			var that = this;

			this.model.width = width;
			this.model.height = height;

	        var sizeValues = {
	        	id: this.model.id,
	        	width: width,
	        	height: height
	        };

	        Card_Services.Resize(this._workspace.getId(), this.model.boardId, this.model.id, sizeValues, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"updateCardSize", 
					workspace: that._workspace.getId(),
					size: sizeValues 
				}));
	        });

			this.$el.attr("is-resized", "true");

			try {
				this.$el.droppable("destroy");
			}
			catch(err) {}
		},

		setCardSize: function(cardId,width,height) { 
			if ((this.model.id == cardId) && (!this._resizing)) {
				this.model.width = width;
				this.model.height = height;

	    		if (width) {
		    		this.$el.attr("is-resized", "true");
					this.$el.css({ width: width });
				}

				if (height) {
		    		this.$el.attr("is-resized", "true");
					this.$el.css({ height: height });
				}
			}	
		},

		// ********** Actions to undo a resize **********

		undoResizing: function(e) {
			e.stopPropagation();

			this.clearSettingsmenu();

			this.removeResizeStyling();

        	this.saveUndoResizing();

			this.render();
		},

		saveUndoResizing: function() {
			var that = this;

	        var sizeValues = {
	        	id: this.model.id,
	        	width: null,
	        	height: null
	        };

	        Card_Services.Resize(this._workspace.getId(), this.model.boardId, this.model.id, sizeValues, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"undoCardResize", 
					workspace: that._workspace.getId(),
					size: sizeValues 
				}));
	        });

        	this.setCardUnsized();
		},

		setCardUnsized: function() {
			if (!this._resizing) {
				this.$("#undo-card-resize-button").hide();

				this.model.width = null;
				this.model.height = null;
				this.$el.removeAttr("is-resized");

				this.$el.css({ width: "" });
				this.$el.css({ width: null });

				this.$el.css({ height: "" });
				this.$el.css({ height: null });
			}
		},

		// ********** Actions for card duplicate **********

		duplicateCard: function(e) {
			var that = this;

			Card_Services.Duplicate(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace.addCardToBoard(response.card);

				that._workspace.sendSocket(JSON.stringify({ 
					action:"boardCardAdded", 
					workspace: that._workspace.getId(),
					card: response.card 
				}));
			});

			this.clearSettingsmenu();
		},

		// ********** Actions for card locking **********

		lockCard: function(e) {
			e.stopPropagation();

			var that = this;

			this.stopCardResize();

        	Card_Services.Lock(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"lockCard", 
					workspace: that._workspace.getId(),
					card: { 
						id: that.model.id
					} 
				}));
	        });

			this.setCardLocked();

	    	this._workspace.sortZIndexes(this.model.id,true);
		},

		setCardLocked: function() {
			this.model.isLocked = true;

			try {
				this.$el.draggable("destroy");
			}
			catch(err) {}

			try {
				this.$el.droppable("destroy");
			}
			catch(err) {}

			this.render();
		},

		unlockCard: function() {
        	Card_Services.Unlock(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"unlockCard", 
					workspace: that._workspace.getId(),
					card: { 
						id: that.model.id
					} 
				}));
	        });

			this.setCardUnlocked();
		},

		setCardUnlocked: function() {
			this.model.isLocked = false;
			
			this.$el.removeClass("locked");

			this.render();
		},

		// ********** Actions to delete a card **********

		delete: function(e) {
			if (e) e.stopPropagation();

			var that = this;

			var cardToDelete = {
				id: this.model.id,
				type: this.model.type,
				owner: this.model.owner,
				boardId: this.model.boardId,
				parentId: this.model.parentId
			};

			Card_Services.Delete(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"boardCardDeleted", 
					workspace: that._workspace.getId(),
					card: cardToDelete 
				}));
			});

			if (this._parent) {
				this._parent.removeCard(cardToDelete.id);

				if (this._parent.saveSortPosition) this._parent.saveSortPosition();
			}
			else  this._workspace.removeCardFromBoard(cardToDelete);
		},

		// ********** Actions for dot voting **********

		addVote: function(e) {
			e.stopPropagation();

			var that = this;

			Cluster_Services.AddVote(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"addVote", 
					workspace: that._workspace.getId(),
					vote: { 
						cluster: that.model.parentId,
						card: that.model.id
					}
				}));
			});

			this.increaseVoteCount();
		},

		increaseVoteCount: function() {
			if (this.model.votesReceived === 0) this.$("#add-vote").attr("src","/img/voteSelected.png");

			this.model.votesReceived++;

			this.$("#vote-count").html(this.model.votesReceived);
		},

		// ********** Actions to set the card z index **********

		setZIndex: function(zIndex) {
    		this.model.zPos = zIndex;
			
			this.$el.zIndex(zIndex);
		},

		destroy: function() {
			$(this.el).detach();
			this.remove();
		}
  	});

	return Card;
});