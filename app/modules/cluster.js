define([
	"modules/card",
	"modules/card.services",
	"modules/cluster.services",
	"modules/utils",
],

function(Card, Card_Services, Cluster_Services, Utils) {
	var Cluster = {};

  	Cluster.Item = Backbone.View.extend({
    	tagName: "div",

    	_isMobile: null,
    	_workspace: null,
    	_parent: null,

    	_editable: true,
		_clusterClickCount: 0,

		_childViews: [],

    	// {{ Contructor }}

		initialize: function(options) {
			this.el.id = "cluster_" + this.model.id;

			this._isMobile = options.isMobile;
			this._workspace = options.workspace;
			this._parent = options.parent;

			this.model.workspaceId = this._workspace.getId();
		},

		// {{ Object Building }}

		render: function() {
			var that = this,
				template = null;

    		if (this.model.parentId != null) {
	    		if (this.model.collapsed) template = "/app/templates/cluster/clusteredCollapsed.html";
	    		else template = "/app/templates/cluster/clusteredItem.html";
    		}
    		else {
	    		if (this.model.collapsed) template = "/app/templates/cluster/collapsed.html";
	    		else template = "/app/templates/cluster/item.html";
    		}

			$.get(template, function(contents) {
				that.$el.html(_.template(contents, that.model));

				that.afterRender();				

				that.unbind();
				that.bind();
			}, "text");
		},

		afterRender: function() {
    		this.$el.attr("element-id", this.model.id);
    		this.$el.attr("object-type", "cluster");

			if (!this._parent) {
				if ((this.model.xPos != null) && (this.model.yPos != null)) this.$el.css({top: this.model.yPos, left: this.model.xPos, position: 'absolute'});
				
				if (this.model.zPos != null) this.$el.zIndex(this.model.zPos);
			}

			if ((this.model.color) && (this.model.color.trim().toLowerCase() != "#ffffff")) this.$el.css({ backgroundColor: "rgba(" + Utils.hexToRgb(this.model.color) + ",0.20)" });
			
			// Build up the clusters child cards and clusters
      		this._childViews = [];

			for (var i=0, cardsLength=this.model.cards.length; i<cardsLength; i+=1) {
        		this.model.cards[i].cluster = this;
        		this.model.cards[i].parentIsVoting = this.model.isVoting;

				if ((this.model.cards[i].cards == null) || (this.model.cards[i].cards.length === 0)) {
					var cardView = new Card.Item({ model: this.model.cards[i], workspace: this._workspace, parent: this });
					cardView.render();

	    			this._childViews.push(cardView);
	    		}
	    		else {
					var clusterView = new Cluster.Item({ model: this.model.cards[i], workspace: this._workspace, parent: this });
					clusterView.render();

	    			this._childViews.push(clusterView);
	    		}
        	}

			if (!this.model.collapsed) {
				this._childViews.sort(function (a, b) { return a.model.zPos > b.model.zPos ? 1 : a.model.zPos < b.model.zPos ? -1 : 0; });

				for (var i=0; i<this._childViews.length; i++) {
	    			this.$("#cards-container_" + this.model.id).append(this._childViews[i].el);
				}
			}

    		if (this.model.parentId != null) {
	    		if (this.model.collapsed) this.el.className = "box clustered-cluster-content-container-collapsed";
	    		else this.el.className = "box clustered-cluster-content-container";
    		}
    		else {
	    		if (this.model.collapsed) this.el.className = "box cluster-content-container-collapsed";
	    		else this.el.className = "box cluster-content-container";
    		}		
    	},

	    unbind: function() {
			if (!this._isMobile) {
				this.$el.unbind("click");
				this.$el.unbind("mouseup");
				this.$el.unbind("dblclick");
				this.$el.unbind("mouseover");
				this.$el.unbind("mouseout");

				this.$("#cluster-settings-button_" + this.model.id).unbind("click");
			}

			this.$el.unbind("keypress");
			this.$el.unbind("draggable");
			this.$el.unbind("droppable");

			this.$("#edit-title_" + this.model.id).unbind("click");
			this.$("#start-dot-vote").unbind("click");
			this.$("#stop-dot-vote").unbind("click");
	        this.$("#editable-title_" + this.model.id).unbind("blur");
			this.$("#add-vote").unbind("click");
	    },

	    bind: function() {
	    	var that = this;

			if (this._isMobile) {
				if (!this._mobileEventsBound) {
					var touchComplete = null;

	      			this.$el.click(function(e) {
	   					e.stopPropagation();
	   					e.preventDefault();
	      			});

					this.$el.on("touchstart touchend taphold", function(e) {
	   					e.preventDefault();
	   					e.stopPropagation();
	   					
	   					if (e.type.toString() == "touchstart") {
							touchComplete = function() {
		   						if (that._showSettingsIcon) that.clearSettingsmenu(e);

					        	that.touchTapped();
							}
	   					}
	   					else if (e.type.toString() == "taphold") {
							if ((!that.model.parentId) && (!that._dragging)) {
								touchComplete = function() {
									that.$("#cluster-action-container_" + that.model.id).show();
									
									that.showSettingsMenu(e);
								}
							}
							else {
								touchComplete = null;
							}
	   					}
	   					else if (e.type.toString() == "touchend") {
	   						if ((!that._dragging) && (touchComplete != null)) touchComplete();
							else that._dragging = false;

							touchComplete = null;

			    			if ((that._workspace.getSelectedPageTool() == "pen") || (that._workspace.getSelectedPageTool() == "eraser")) that._workspace.stopDrawing();
	   					}
					});
				}
			}
			else {
	  			this.$el.click(function(e) {
		        	that.clearSettingsmenu();

		        	if (that._parent) that._parent.bubbleClearSettingsmenu();

		        	that.cascadeClearSettingsmenu();
	  			});

				this.$el.mouseup(function(e) {
			    	if ((that._workspace.getSelectedPageTool() == "pen") || (that._workspace.getSelectedPageTool() == "eraser")) that._workspace.stopDrawing();
				});

	  			this.$el.dblclick(function(e) {
					e.stopPropagation();

					that.toggleCollapsed();
				});

	  			this.$("#cluster-settings-button_" + this.model.id).click(function(e) {
					if (that._parent) that._parent.bubbleClearSettingsmenu();

		        	that.cascadeClearSettingsmenu();

		        	that.showSettingsMenu(e);
	  			});

	        	this.$el.mouseover(function() {
	        		if (that._parent) { 
	        			if (that._parent._editable) that._parent._editable = false;

	        			if (that._parent.hideHoverIcons) that._parent.hideHoverIcons();
	        		}

	        		that.showHoverIcons();
	        	});

	        	this.$el.mouseout(function() {
	        		if ((that._parent != undefined) && (that._parent._editable != undefined)) that._parent._editable = true;
	    			
	        		that.hideHoverIcons();
	        	});
	        }

        	this.$("#edit-title_" + this.model.id).click(function(e) {
	        	that.clearSettingsmenu();

        		that.editCluster(e);
				
				that.$("#editable-title_" + that.model.id).focus().val('').val(that.$("#cluster-title_" + that.model.id).html());
        	});

        	this.$("#start-dot-vote").click(function(e) {
	        	that.clearSettingsmenu();

        		that.startDotVoting(e);
        	});

        	this.$("#stop-dot-vote").click(function(e) {
	        	that.clearSettingsmenu();

        		that.stopDotVoting(e);
        	});

        	this.$("#add-vote").click(function(e) {
        		that.addVote(e);
        	});

        	var startPageX = null,
        		startPageY = null,
        		startDragX = null,
        		startDragY = null;

        	this.$el.draggable({
				start: function( e, ui ) {
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

					that.$el.zIndex(999999999999999);
				},
				drag: function( e, ui ) {
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
							clusterPosition = {
								x: that.$el.position().left + totalParentOffset.x,
								y: that.$el.position().top + totalParentOffset.y
							}, 
							mousePosition = {
								x: (e.pageX/zoom) + that._workspace.getBoardScrollWidth() - boardDistanceFromSource.x,
								y: (e.pageY/zoom) + that._workspace.getBoardScrollHeight() - boardDistanceFromSource.y
							};

						if (targetBoard.getId() != that.model.boardId) {
							if (that._parent) {
								clusterPosition = {
									x: that.$el.position().left + totalParentOffset.x - boardDistance.x,
									y: that.$el.position().top + totalParentOffset.y - boardDistance.y
								};
							}
							else {
								clusterPosition = {
									x: that.$el.position().left - boardDistance.x,
									y: that.$el.position().top - boardDistance.y
								};
							}
						}

						var elementId = that._workspace.checkPositionTaken(targetBoard.getId(), that.model.id, mousePosition.x, mousePosition.y),
							currentBoardId = that.model.boardId;

						that.model.boardId = targetBoard.getId();
						that.model.xPos = clusterPosition.x;
						that.model.yPos = clusterPosition.y;

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

						    	that._workspace.addClusterToBoard(that.model);
							}
							else {
								that.updateClusterPosition(that.model.xPos, that.model.yPos);
						    	
					    		that._workspace.sortZIndexes(that.model.id, true);
					    	}
			        	}
			        	else {
			        		var entity = that._workspace.getBoardEntity(elementId);

							if (entity.getType() == "card") {
								if (!entity.getIsLocked()) that._workspace.createClusterFromCluster(targetBoard.getId(), that.model.id, elementId);
								else {
						        	that.updateClusterPosition(that.model.xPos, that.model.yPos);
							    	
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

			if (!that.model.collapsed) {
	        	this.$el.droppable({
	        		accept: ".card-container,.clustered-card-container,.clustered-cluster-content-container-collapsed,.clustered-cluster-content-container,.cluster-content-container-collapsed,.cluster-content-container",
	        		tolerance: "pointer",
	            	zoom: this._workspace.getZoom(),
	            	greedy:true,
	           		drop: function(e, ui) {
						e.stopPropagation();

	 					if (!that.model.collapsed) {
		   					var isChild = false;

		       				if  ($(ui.draggable).attr("object-type") == "card") {
		       					var updateDetail = {
									boardId: that.model.boardId,
									clusterId: that.model.id,
									cardId: $(ui.draggable).attr("element-id")
								};

	       						if ((!$(ui.draggable).attr("is-resized")) || ($(ui.draggable).attr("is-resized") == "false")) {
			       					for (var i=0; i<that._childViews.length; i++) {
			       						if ((that._childViews[i].getType() == "card") && (that._childViews[i].model.id.toString()== updateDetail.cardId.toString())) isChild = true;
			       					}

			       					if (!isChild) {	
										Card_Services.SetBoard(that._workspace.getId(), that.model.boardId, updateDetail.cardId);

										that._workspace.addCardToCluster(that.model.boardId, updateDetail.clusterId, updateDetail.cardId);

										Cluster_Services.AttachCard(that._workspace.getId(), that.model.boardId, updateDetail.clusterId, updateDetail.cardId, function(response) {
											that._workspace.sendSocket(JSON.stringify({ 
												action:"addCardToCluster", 
												workspace: that._workspace.getId(),
												updateDetail: updateDetail
											}));
										});
									}
								}
		       				}
		       				else if ($(ui.draggable).attr("object-type") == "cluster") {
		       					var updateDetail = {
									boardId: that.model.boardId,
									sourceClusterId: $(ui.draggable).attr("element-id"),
									targetClusterId: that.model.id
								};

		       					for (var i=0; i<that._childViews.length; i++) {
		       						if ((that._childViews[i].getType() == "cluster") && (that._childViews[i].model.id == updateDetail.sourceClusterId)) isChild = true;
		       					}

		       					if ((!isChild) && (updateDetail.targetClusterId != updateDetail.sourceClusterId)) {
									Card_Services.SetBoard(that._workspace.getId(), that.model.boardId, updateDetail.sourceClusterId);

									that._workspace.addClusterToCluster(that.model.boardId, updateDetail.targetClusterId, updateDetail.sourceClusterId);

		       						Cluster_Services.AttachCluster(that._workspace.getId(), that.model.boardId, updateDetail.targetClusterId, updateDetail.sourceClusterId, function(response) {
		       							that._workspace.sendSocket(JSON.stringify({ 
		       								action:"addClusterToCluster", 
											workspace: that._workspace.getId(),
		       								updateDetail: updateDetail 
		       							}));
		       						});
								}
		       				}

		       				if (isChild) {
		       					var elementId = $(ui.draggable).attr("element-id");

		       					if (elementId) {
			       					var selectedElement = null;

			       					for (var i=0; i<that._childViews.length; i++) {
			       						if (that._childViews[i].model.id == elementId) {
			       							selectedElement = that._childViews[i];
			       							break;
			       						}
			       					}

				       				if (selectedElement) that.changeSortPosition(selectedElement);
		       					}
		       				}
		           		}
	        		}
	        	});
			}

			this._mobileEventsBound = true;
		},

		touchTapped: function() {
			var that = this;
 
			this._clusterClickCount++;

		    if (this._clusterClickCount === 1) {
		        singleClickTimer = setTimeout(function() { 
		            that._clusterClickCount = 0;
		        }, 250);
		    } else if (this._clusterClickCount === 2) {
		        clearTimeout(singleClickTimer);
		
		        this._clusterClickCount = 0;

		        this.toggleCollapsed();
		    }
		},

	    // {{ Getters }}

	    // ********** Global card view getters **********

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
	    	return "cluster";
	    },

	    // ********** Cluster specific getters **********

	    getChildCardCount: function() {
	    	return this.model.cards.length;
	    },

		getChild: function(id) {
			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				if (this._childViews[i].getId() == id) return this._childViews[i];
				else if (this._childViews[i].getType() == "cluster") {
					var obj = this._childViews[i].getChild(id);

					if (obj) return obj;
				}
			}

			return null;
		},

		getTotalParentOffset: function() {
			if (this._parent) {
				var parentOffset = this._parent.getTotalParentOffset();
	 		
	 			return {
					x: parentOffset.x + this.$el.position().left,
					y: parentOffset.y + this.$el.position().top
				};
			}
			else return {
				x: this.$el.position().left,
				y: this.$el.position().top
			};
		},

	    // {{ Setters }}

	    // ********** Global card view setters **********

	    setBoardId: function(boardId) {
	    	this.model.boardId = boardId;

			for (var i = 0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				this._childViews[i].setBoardId(boardId);
			}
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

	    // ********** Cluster specific setters **********

	    addCard: function(cardModel) {
	    	this.model.cards.push(cardModel);
	    },

	    setCollapsed: function(collapsed) {
	    	this.model.collapsed = collapsed;
	    },

	    // {{ Public Methods }}

		// ********** Actions for displaying edit icons **********

		showHoverIcons: function () {
			if ((this._editable)) this.$("#cluster-action-container_" + this.model.id).show();
		},

	    hideHoverIcons: function() {
	    	if (!this._showSettingsIcon) this.$("#cluster-action-container_" + this.model.id).hide();
	    },

		// ********** Actions for showing the settings menu **********

		showSettingsMenu: function(e) {
			e.stopPropagation();

			if (!this.$("#cluster-settings-menu_" + this.model.id).is(':visible')) {
				this.$("#cluster-settings-menu_" + this.model.id).show();

				this._showSettingsIcon = true;
			}
			else this.clearSettingsmenu();
		},

		bubbleClearSettingsmenu: function() {
			this.clearSettingsmenu();

			if (this._parent) this._parent.bubbleClearSettingsmenu();
		},

		cascadeClearSettingsmenu: function() {
			for (var i = 0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				this._childViews[i].clearSettingsmenu();
				
				if (this._childViews[i].getType() == "cluster") this._childViews[i].cascadeClearSettingsmenu();
			}
		},

		clearSettingsmenu: function() {
			this.$("#cluster-settings-menu_" + this.model.id).hide();
			this.$("#cluster-action-container_" + this.model.id).hide();

			this._showSettingsIcon = false;

			for (var i = 0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				this._childViews[i].clearSettingsmenu();
			}
		},

		// ********** Actions for setting cluster position **********

		updateClusterPosition: function(left,top) {
			Cluster_Services.UpdatePosition(this._workspace.getId(), this.model.boardId, this.model.id, left, top);

			this._workspace.sendSocket(JSON.stringify({
				action:"updateClusterPosition",
				workspace: this._workspace.getId(),
				cluster: {
		        	id: this.model.id,
		        	boardId: this.model.boardId,
		        	xPos: left,
		        	yPos: top
		        }
			}));
		},

		setClusterPosition: function(clusterId,left,top) { 
			if (this.model.id == clusterId) {
				this.model.xPos = left;
				this.model.yPos = top;

				this.render();
			}	
		},

		// ********** Actions to update sort position **********

		changeSortPosition: function(selectedElement) {
			var newIndex = -1
				selectedElementIndex = -1;

			for (var i=(this._childViews.length-1); i>=0; i-=1) {
				if ((newIndex == -1) && ((this._childViews[i].getId() != selectedElement.getId()) && (this._childViews[i].$el.position().top < selectedElement.$el.position().top))) newIndex=i+1;
				if (this._childViews[i].getId() == selectedElement.getId()) selectedElementIndex = i;
			}

			if (newIndex == -1) newIndex = 0;

			var selectedCardModel = this.model.cards[selectedElementIndex];

			this.model.cards.splice(selectedElementIndex, 1);
			this.model.cards.splice(newIndex, 0, selectedCardModel);

			this.saveSortPosition();

			this.render();
		},

		saveSortPosition: function() {
			var that = this,
				cardOrder = [];

			for (var i=0, cardsLength=this.model.cards.length; i<cardsLength; i+=1) {
				if (this.model.cards[i]) {
					this.model.cards[i].zPos = i;
					cardOrder.push(this.model.cards[i].id);
				}
			}

			Cluster_Services.Sort(this._workspace.getId(), this.model.boardId, this.model.id, cardOrder, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"sortCluster", 
					workspace: that._workspace.getId(),
					sortOrder: {
						clusterId: that.model.id,
						cards: cardOrder
					} 
				}));
			});

	    	this.render();
		},

		updateSortPosition: function(cards) {
			var that = this;

			for (var i=0, cardsLength=cards.length; i<cardsLength; i+=1) {
				var elementFound = false;

				for (var j=0, existingCardsLength=this.model.cards.length; j<existingCardsLength; j+=1) {
					if (this.model.cards[j].id == cards[i]) {
						elementFound = true;

						this.model.cards[j].zPos = (i+1);
					}
	        	}
			}

			this.render();
		},

		// ********** Actions for collapse and expand clusters **********

		saveAndCollapseCluster: function() {
			var that = this;

			Cluster_Services.Collapse(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"collapseCluster", 
					workspace: that._workspace.getId(),
					cluster: { 
						id:  that.model.id
					}
				}));
			});

			this.collapseCluster();
		},

		collapseCluster: function(clusterId) {
			if (clusterId) {
				if (this.model.id == clusterId) {
					this.model.collapsed = true;

					this.render();
				}

				for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
					if (this._childViews[i].getType() == "cluster") this._childViews[i].collapseCluster(clusterId);
				}
			}
			else {
				this.model.collapsed = true;

				this.render();
			}
		},

		saveAndExpandCluster: function() {
			var that = this;

			Cluster_Services.Expand(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"expandCluster", 
					workspace: that._workspace.getId(), 
					cluster: { 
						id:  that.model.id
					}
				}));
			});

			this.expandCluster();
		},

		expandCluster: function(clusterId) {
			if (clusterId) {
				if (this.model.id == clusterId) {
					this.model.collapsed = false;

					this.render();
				}

				for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
					if (this._childViews[i].getType() == "cluster") this._childViews[i].expandCluster(clusterId);
				}
			}
			else {
				this.model.collapsed = false;

				this.render();
			}
		},

		// ----- Set switch the clusters collapsed position
		toggleCollapsed: function() {
	        if (this.model.parentId) {
				if (this.model.collapsed) this.expandCluster();
				else this.collapseCluster();
			}
			else {
				if (this.model.collapsed) this.saveAndExpandCluster();
				else this.saveAndCollapseCluster();
			}
		},

		// ********** Actions for editing cluster **********

		editCluster: function(e) {
			e.stopPropagation();

			this._workspace.showEditCard(this.model);
		},

		updateClusterTitle: function(clusterId, title, content) {
			if (this.model.id == clusterId) {
				if (title) {
					this.model.title = title;

					this.$("#cluster-title_" + this.model.id).html(title);
					this.$("#editable-title_" + this.model.id).val(title);
				}
				else if (content) {
					this.model.content = content;

					this.$("#cluster-title_" + this.model.id).html(content);
					this.$("#editable-title_" + this.model.id).val(content);
				}
			}

			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				if (this._childViews[i].getType() == "cluster") this._childViews[i].updateClusterTitle(clusterId, title, content);
			}
		},

		// ********** Actions for deleting cluster **********

		delete: function() {
			var that = this;

			var cardToDelete = {
				id: that.model.id,
				type: that.model.type,
				owner: that.model.owner,
				boardId: that.model.boardId,
				parentId: that.model.parentId
			};

			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				this._childViews[i].delete();
			}

			Card_Services.Delete(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace.sendSocket(JSON.stringify({ 
					action:"boardCardDeleted", 
					workspace: that._workspace.getId(),
					card: cardToDelete
				}));
			});

			this._workspace.removeCardFromBoard(cardToDelete);
		},

		// ********** Actions for deleting cards **********

		deleteCard: function(cardId) {
			var that = this,
				clusterUpdated = false;

			for (var i=0, cardsLength=this.model.cards.length; i<cardsLength; i+=1) {
				if ((this.model.cards[i] != null) && (this.model.cards[i].id == cardId)) {
					that.model.this.model.cards.splice(i,1);
					clusterUpdated = true;
				}
			}

			if (clusterUpdated) {
				if (that.model.cards.length > 0) this.render();
				else this._parent.makeClusterCard(this.model.id);
			}

			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				if (this._childViews[i].getType() == "cluster") this._childViews[i].deleteCard(cardId);
			}
		},

		removeCard: function(cardId, position) {
			var that = this,
				cardModel = null;

			for (var i=0, cardsLength=this.model.cards.length; i<cardsLength; i+=1) {
				if ((this.model.cards[i] != null) && (this.model.cards[i].id == cardId)) {
					cardModel = this.model.cards[i];

					this.model.cards.splice(i,1);

					var updateDetail = {
						clusterId: that.model.id,
						cardId: cardId
					};

					if (position) {
						updateDetail.xPos = position.xPos;
						updateDetail.yPos = position.yPos;
					}

					if (cardModel.cards.length === 0) {
						// This is a card so call the detach card method
						Cluster_Services.DetachCard(that._workspace.getId(), that.model.boardId, that.model.id, cardId, function(response) {
			            	if (response.code == 200) {
								if (position) {
									Card_Services.UpdatePosition(that._workspace.getId(), that.model.boardId, cardId, position.xPos, position.yPos);

							    	//that._workspace.sortZIndexes(that.model.id, true);
								}

								that._workspace.sendSocket(JSON.stringify({ 
									action:"removeCardFromCluster", 
									workspace: that._workspace.getId(),
									updateDetail: updateDetail
								}));
							}
						});
					}
					else {
						// This is a card so call the detach cluster method
						Cluster_Services.DetachCluster(that._workspace.getId(), that.model.boardId, that.model.id, cardId, function(response) {
			            	if (response.code == 200) {
								if (position) {
									Cluster_Services.UpdatePosition(that._workspace.getId(), that.model.boardId, cardId, position.xPos, position.yPos);
							    	
							    	that._workspace.sortZIndexes(that.model.id, true);
								}

								that._workspace.sendSocket(JSON.stringify({ 
									action:"removeClusterFromCluster", 
									workspace: that._workspace.getId(),
									updateDetail: updateDetail
								}));
							}
						});
					}

					break;
				}
			}
					
			if (cardModel) {
				if (this.model.cards.length === 0) {
					if (this._parent) this._parent.render();
					else this._workspace.setClusterToCard(this.model.id);
				}
				else this.render();

				return cardModel;
			}
			else {
				for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
					if (this._childViews[i].getType() == "cluster") {
						cardModel = this._childViews[i].removeCard(cardId);

						if (cardModel) return cardModel;
					}
				}
			}
		},

		makeClusterCard: function(clusterId) {
			var clusterUpdated = false;

			for (var i=0, clustersLength=cards.length; i<clustersLength; i+=1) {
				if ((cards[i] != null) && (cards[i].id == clusterId)) {
					that.model.cards.splice(i,1);

					clusterUpdated = true;
				}
			}

			if (clusterUpdated) this.render();
		},

		detachAndReturn: function(itemId) {
			var modelItem = null;

			if (this.model.cards) {
				for (var i=(this.model.cards.length-1); i>=0; i-=1) {
					if (this.model.cards[i].id == itemId) {
						modelItem = this.model.cards[i];

						this.model.cards.splice(i,1);
					}
				}
			}

			if (modelItem) {
				this.render();

				return modelItem;
			}

			for (var i=0; i<this._childViews.length; i++) {
		       	if (this._childViews[i].getType() == "cluster") {
					var searched = this._childViews[i].detachAndReturn(itemId);

					if (searched) return searched;
				}
			}

			return null;
		},

		// ********** Actions for managing attached cards **********

		addCardToCluster: function(clusterId, cardModel) {
			if (this.model.id == clusterId) {
				if (this.model.isVoting) {
					var existingVotes = 0,
						voteCountMatches = [];

	  				if (cardModel.type == "text") {
	  					voteCountMatches = cardModel.content.match(/ \(\+(.*?)\)/g);

	  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = cardModel.content.match(/\(\+(.*?)\)/g);
	  				}
	  				else {
	  					voteCountMatches = cardModel.title.match(/ \(\+(.*?)\)/g);

	  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = cardModel.title.match(/\(\+(.*?)\)/g);
	  				}

					if ((voteCountMatches != null) && (voteCountMatches.length > 0)) {
						existingVotes = voteCountMatches[0].trim().replace("(+","").replace(")","");

	  					if (cardModel.type == "text") cardModel.content = cardModel.content.replace(voteCountMatches[0],"");
	  					else cardModel.title = cardModel.title.replace(voteCountMatches[0],"");
					}

	      			cardModel.votesReceived = parseInt(existingVotes);
      			}

      			cardModel.parentId = this.model.id;
				cardModel.parentIsVoting = this.model.isVoting;
				cardModel.zPos = (this._childViews.length + 1);

				this.model.cards.push(cardModel);

				var cardView = new Card.Item({ model: cardModel, workspace: this._workspace, parent: this });
				cardView.render();

		    	this.$("#cards-container_" + this.model.id).first().append(cardView.el);

				this._childViews.push(cardView);
			}

			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
	  			if (this._childViews[i].getType() == "cluster") this._childViews[i].addCardToCluster(clusterId, cardModel);
			}
		},

		updateCardContent: function(cardId,content,title,color) {
			if (this.model.id == cardId) {
				this.model.content = content;
				this.model.title = title;
				this.model.color = color;

				this.render();
			}

			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				this._childViews[i].updateCardContent(cardId,content,title,color);
			}
		},

		// ********** Actions for managing attached clusters **********

		addClusterToCluster: function(targetCluster, newCluster) {
			if (this.model.id == targetCluster) {
				if (this.model.isVoting) {
					var existingVotes = 0,
						voteCountMatches = [];

	  				if (newCluster.type == "text") {
	  					voteCountMatches = newCluster.content.match(/ \(\+(.*?)\)/g);

	  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = newCluster.content.match(/\(\+(.*?)\)/g);
	  				}
	  				else {
	  					voteCountMatches = newCluster.title.match(/ \(\+(.*?)\)/g);

	  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = newCluster.title.match(/\(\+(.*?)\)/g);
	  				}

					if ((voteCountMatches != null) && (voteCountMatches.length > 0)) {
						existingVotes = voteCountMatches[0].trim().replace("(+","").replace(")","");

	  					if (newCluster.type.trim().toLowerCase() == "text") newCluster.content = newCluster.content.replace(voteCountMatches[0],"");
	  					else newCluster.title = newCluster.title.replace(voteCountMatches[0],"");
					}

	      			newCluster.votesReceived = parseInt(existingVotes);
      			}

      			newCluster.parentId = this.model.id;
				newCluster.parentIsVoting = this.model.isVoting;
				newCluster.collapsed = true;
				newCluster.zPos = (this._childViews.length + 1);

				this.model.cards.push(newCluster);

				var clusterView = new Cluster.Item({ model: newCluster, workspace: this._workspace, parent: this });
				clusterView.render();

    			this.$("#cards-container_" + this.model.id).first().append(clusterView.el);
    			this._childViews.push(clusterView);
			}
			else {
				for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
					if (this._childViews[i].getType() == "cluster") this._childViews[i].addClusterToCluster(targetCluster, newCluster);
				}
			}
		},

		// ********** Actions for Dot Voting **********

		startDotVoting: function(e) {
			e.stopPropagation();

			var that = this;

			Cluster_Services.StartDotVoting(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace._socket.send(JSON.stringify({ 
					action:"startDotVoting",
					workspace: that._workspace.getId(),
					cluster: { 
						id: that.model.id
					} 
				}));
			});

			this.displayStartDotVoting();
		},

		displayStartDotVoting: function() {
        	this.model.isVoting = true;

			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
				var existingVotes = 0,
					voteCountMatches = [];

  				if (this._childViews[i].model.type == "text") {
  					voteCountMatches = this._childViews[i].model.content.match(/ \(\+(.*?)\)/g);

  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = this._childViews[i].model.content.match(/\(\+(.*?)\)/g);
  				}
  				else {
  					voteCountMatches = this._childViews[i].model.title.match(/ \(\+(.*?)\)/g);

  					if ((voteCountMatches == null) || (voteCountMatches.length == 0)) voteCountMatches = this._childViews[i].model.title.match(/\(\+(.*?)\)/g);
  				}

				if ((voteCountMatches != null) && (voteCountMatches.length > 0)) {
					existingVotes = voteCountMatches[0].trim().replace("(+","").replace(")","");

  					if (this._childViews[i].model.type.trim().toLowerCase() == "text") this._childViews[i].model.content = this._childViews[i].model.content.replace(voteCountMatches[0],"");
  					else this._childViews[i].model.title = this._childViews[i].model.title.replace(voteCountMatches[0],"");
				}

      			this._childViews[i].model.parentIsVoting = true;
      			this._childViews[i].model.votesReceived = parseInt(existingVotes);
      		}

        	this.render();
		},

		stopDotVoting: function(e) {
			e.stopPropagation();

			var that = this;

			Cluster_Services.StopDotVoting(this._workspace.getId(), this.model.boardId, this.model.id, function(response) {
				that._workspace._socket.send(JSON.stringify({ 
					action:"stopDotVoting",
					workspace: that._workspace.getId(),
					cluster: { 
						id: that.model.id
					}
				}));
			});

			this.displayStopDotVoting();
		},

		displayStopDotVoting: function() {
        	this.model.isVoting = false;

			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
      			if (this._childViews[i].model.votesReceived > 0) {
      				if (this._childViews[i].model.type == "text") this._childViews[i].model.content = this._childViews[i].model.content + " (+" + this._childViews[i].model.votesReceived + ")";
      				else this._childViews[i].model.title = this._childViews[i].model.title + " (+" + this._childViews[i].model.votesReceived + ")";
      			}

      			this._childViews[i].model.parentIsVoting = false;
      			this._childViews[i].model.votesReceived = 0;
      		}

        	this.render();
		},

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
			var updateIconToSelected = false;
			if (this.model.votesReceived === 0) updateIconToSelected = true;

			this.model.votesReceived = this.model.votesReceived+1;

			this.$("#vote-count").html(this.model.votesReceived);

			if (updateIconToSelected) this.$("#add-vote").attr("src","/img/voteSelected.png");
		},

		updateChildVotes: function(cardId) {
			for (var i=0, childViewsLength=this._childViews.length; i<childViewsLength; i+=1) {
      			if (this._childViews[i].getId() == cardId) this._childViews[i].increaseVoteCount();
      		}
		},

		// ********** Actions for setting z-index **********

		setZIndex: function(zIndex) {
    		this.model.zPos = zIndex;
			
			this.$el.zIndex(zIndex);
		},

		destroy: function() {
			$(this.el).detach();
			this.remove();
		}
  	});

	return Cluster;
});