define([
	"modules/board.add",
	"modules/board",
	"modules/board.model",
	"modules/card.add",
	"modules/card",
	"modules/card.model",
	"modules/cluster",
	"modules/cluster.model",
	"modules/boardMap",
	"modules/utils",
	"modules/css.helpers",
	"modules/workspace.services",
	"modules/board.services",
	"modules/card.services",
	"modules/cluster.services",
	"jquery"
],

function(AddBoard, Board, BoardModel, AddCard, Card, CardModel, Cluster, ClusterModel, BoardMap, Utils, CSSHelpers, Workspace_Services, Board_Services, Card_Services, Cluster_Services) {
	var Workspace = {};

	// ===== View for viewing a workdspace

	Workspace.Index = Backbone.View.extend({
		el: "<div>",

		_mode: "boardMap",

		_zoom: 1,
		_boardWidth: null,
		_boardHeight: null,

		_boardMap: null,
		_selectedBoardId: null,
		_selectedBoard: null,

		_boardEntities: [],
		
		_dropBoardId: null,
		_dropPosition: null,
	    _cardsDroppedInPosition: 0,

    	// {{ Contructor }}

		initialize: function(options) {
			this.render();

		    // Check if is being viewed on a mobile device

			var iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;
			var android = navigator.userAgent.match(/Android/i) ? true : false;

		    this._isMobile = (iOS || android);	
		},

		// {{ Object Building }}

		render: function() {
			var that = this;

			$.get("/app/templates/workspace/index.html", function(contents) {
				that.$el.html(_.template(contents, that.model));

				that.connectSockets();

				that.setupWorkspace();

				that.unbind();
				that.bind();
			}, "text");
		},

		// {{ Event Binding }}

		unbind: function() {
			this.$("#header-logo").unbind("click");

			this.$("#view-board-map").unbind("click");

			this.$("#card-create-overlay").unbind("click");

			this.$("#zoom-in-container").unbind("click");
			this.$("#zoom-out-container").unbind("click");

			this.$("#north-board-navigation").unbind("click");
			this.$("#south-board-navigation").unbind("click");
			this.$("#east-board-navigation").unbind("click");
			this.$("#west-board-navigation").unbind("click");

		},

		bind: function() {
			var that = this;

			this.$("#header-logo").click(function(event) {
				window.location.href = "/main";
			});

			this.$("#view-board-map").click(function(event) {
				if (that._mode == "boardMap") that._mode = "individual";
				else that._mode = "boardMap";

				that.renderBoards();
			});

			this.$("#card-create-overlay").click(function(event) {
				that.hideAddCard();
			});

			this.$("#zoom-in-container").click(function(event) {
				that.zoomIn();
			});

			this.$("#zoom-out-container").click(function(event) {
				that.zoomOut();
			});

			this.$("#north-board-navigation").click(function(event) {
				event.stopPropagation();
				event.preventDefault();
			
				if (that._selectedBoard) {
					var newYPos = that._selectedBoard.getPositionY()-1;
					if (newYPos === 0) newYPos = -1;

					var newXPos = that._selectedBoard.getPositionX(),
						newSelectedBoard = that._boardMap.getBoardAtIndex(newXPos, newYPos);

					if (newSelectedBoard) {
						that._selectedBoardId = newSelectedBoard.getId();
						that.renderBoards();
					}
				}
			});

			this.$("#south-board-navigation").click(function(event) {
				event.stopPropagation();
				event.preventDefault();
			
				if (that._selectedBoard) {
					var newYPos = that._selectedBoard.getPositionY()+1;
					if (newYPos === 0) newYPos = 1;

					var newXPos = that._selectedBoard.getPositionX(),
						newSelectedBoard = that._boardMap.getBoardAtIndex(newXPos, newYPos);

					if (newSelectedBoard) {
						that._selectedBoardId = newSelectedBoard.getId();
						that.renderBoards();
					}
				}
			});

			this.$("#east-board-navigation").click(function(event) {
				event.stopPropagation();
				event.preventDefault();
			
				if (that._selectedBoard) {
					var newXPos = that._selectedBoard.getPositionX()+1;
					if (newXPos === 0) newXPos = 1;

					var newYPos = that._selectedBoard.getPositionY(),
						newSelectedBoard = that._boardMap.getBoardAtIndex(newXPos, newYPos);

					if (newSelectedBoard) {
						that._selectedBoardId = newSelectedBoard.getId();
						that.renderBoards();
					}
				}
			});

			this.$("#west-board-navigation").click(function(event) {
				event.stopPropagation();
				event.preventDefault();

				if (that._selectedBoard) {
					var newXPos = that._selectedBoard.getPositionX()-1;
					if (newXPos === 0) newXPos = -1;

					var newYPos = that._selectedBoard.getPositionY(),
						newSelectedBoard = that._boardMap.getBoardAtIndex(newXPos, newYPos);

					if (newSelectedBoard) {
						that._selectedBoardId = newSelectedBoard.getId();
						that.renderBoards();
					}
				}
			});
/*
			$.cssNumber.zoom = true;
			if (!("zoom" in document.body.style)) {
				$.cssHooks.zoom = {
					get: function(elem, computed, extra) {
						var value = $(elem).data('zoom');
						return value != null ? value : 1;
					},
					set: function(elem, value) {
						var $elem = $(elem);
						var size = { // without margin
							width: $elem.outerWidth(),
							height: $elem.outerWidth()
						};
						$elem.data('zoom', value);

						if (value != 1) {
							$elem.css({
								transform: 'scale(' + value + ')'
							});

							console.log(((size.height * (1-value))/2));
							console.log(((size.width * (1-value))/2));

							$elem.css({ top: ((size.height * (1-value))/2), left: ((size.width * (1-value))/2) });

							console.log(parseInt($elem.css("top")))
						} else {
							$elem.css({
								transform: null
							});
						}
					}
				};
			} */
		},

      	unbindBoard: function(boardId) {
			var canvas = document.getElementById("page-canvas_" + boardId);

			if (canvas) {
				if (this._isMobile) {
					try {
						canvas.removeEventListener('touchstart');
					}
					catch (err) {}

					try {
						canvas.removeEventListener('touchend');
					}
					catch (err) {}

					try {
						canvas.removeEventListener('touchmove');
					}
					catch (err) {}
				}
				else {
					try {
						canvas.removeEventListener('click');
					}
					catch (err) {}

					try {
						canvas.removeEventListener('dblclick');
					}
					catch (err) {}
				}
			}
      	},

      	bindBoard: function(boardId) {
			var that = this,
				canvas = document.getElementById("page-canvas_" + boardId);

			if (canvas) {
				if (this._isMobile) {
					canvas.addEventListener("touchstart", function(e) {
					}, false);

					canvas.addEventListener("touchend", function(e) {
					}, false);

					canvas.addEventListener("touchmove", function(e) {
					}, false);
				}
				else {
		            canvas.addEventListener('click', function(e) {
						that.removePopups();
					});

		            canvas.addEventListener('dblclick', function(e) {
						if (that.getSelectedPageTool() == "card") {
		        			that._dropBoardId = boardId;

		        			that._dropPosition = { 
		        				x: e.offsetX,  
		        				y: e.offsetY 
		        			};

		        			that._cardsDroppedInPosition = 0;

							that.showAddCard();
					    }
					});

					canvas.onmousedown = function(e) {
					};

					canvas.onmouseup = function(e) {
					}
				}
			}
      	},

		// {{ Getters }}

		getSelectedColor: function() {
			return "#ffffff";
		},

		getSelectedPageTool: function() {
			return "card";
		},

		getMode: function() {
			return this._mode;
		},

		getId: function() {
			return this.model.id;
		},

		getZoom: function() {
			return this._zoom;
		},

		getAvailablePositions: function(xPos, yPos) {
			if (this._boardMap) return this._boardMap.getAvailablePositions(xPos, yPos);
			else return [];
		},

		getBoardDistanceFromSource: function(sourceBoardId,targetBoardId) {
			if (this._mode == "individual") {
				return {
					x: this._selectedBoard.getRelativeXPos(),
					y: this._selectedBoard.getRelativeYPos()
				};
			}
			else {
				var targetBoard = this._boardMap.getBoard(targetBoardId);

				return {
					x: targetBoard.getRelativeXPos()+this.$("#table-container").position().left,
					y: targetBoard.getRelativeYPos()+this.$("#table-container").position().top
				};
			}
		},

		getBoardDistance: function(sourceBoardId,targetBoardId) {
			var sourceBoard = this._boardMap.getBoard(sourceBoardId),
				targetBoard = this._boardMap.getBoard(targetBoardId);

			return {
				x: (targetBoard.getRelativeXPos()-sourceBoard.getRelativeXPos()),
				y: (targetBoard.getRelativeYPos()-sourceBoard.getRelativeYPos())
			};
		},

		getBoardScrollWidth: function() {
			return this.$("#board-container").scrollLeft();
		},

		getBoardScrollHeight: function() {
			return this.$("#board-container").scrollTop();
		},

		getBoardWidth: function() {
			return this.model.boardWidth;
		},

		getBoardHeight: function() {
			return this.model.boardHeight;
		},

		getBoards: function() {
			return this.model.boards;
		},

		getBoardCount: function() {
			return this.model.boards.length;
		},

		getDropBoardId: function() {
			if (this._dropBoardId) return this._dropBoardId;
			else if (this._boardMap) {
				var screenCenterX = ($(window).width()/2) + this.$("#board-container").scrollLeft(),
					screenCenterY = ($(window).height())/2 + this.$("#board-container").scrollTop();

				var board = this._boardMap.getBoardInPosition(screenCenterX, screenCenterY);
				
				if (board) return board.getId();
				else {
					return -1;
				}
			}
		},

		getSelectedBoardId: function() {
			if (this._selectedBoard) return this._selectedBoard.getId();
			else return null;
		},

		getBoardEntity: function(id) {
			for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
				if (this._boardEntities[i].getId() == id) return this._boardEntities[i];
				else if (this._boardEntities[i].getType() == "cluster") {
					var obj = this._boardEntities[i].getChild(id);

					if (obj) return obj;
				}
			}

			return null;
		},

		// {{ Public Methods }}

      	// ********** Building Workspace **********

		setupWorkspace: function() {
			// First, build the board map up. We need this regardless of the mode we're in
			var boardXIndexes = [],
				boardYIndexes = [],
				boards = {},
				maxRowSize = 0,
				maxColSize = 0;

			this._selectedBoardId = this.model.startBoardId;

			for (var i=0, boardsLength=this.model.boards.length; i<boardsLength; i+=1) {
				var board = new Board.Index({ model: this.model.boards[i], workspace: this, mode: this._mode }),
					positionX = board.getPositionX(),
					positionY = board.getPositionY();

				if (boardXIndexes.indexOf(positionX) === -1) boardXIndexes.push(positionX);
				if (boardYIndexes.indexOf(positionY) === -1) boardYIndexes.push(positionY);

				if (boards[positionY] == null) boards[positionY] = {};
				boards[positionY][positionX] = board;
			
				// When we set up the workspace we should try to pick the starting board. This is mainly used for the single board view mode.
				if ((this.model.startBoardId) && (this.model.startBoardId.toString() == this.model.boards[i].id.toString())) this._selectedBoard = new Board.Index({ model: this.model.boards[i], workspace: this, mode: this._mode });
			}

			if ((!this.model.startBoardId) && (this.model.boards.length == 0)) this._selectedBoard = new Board.Index({ model: this.model.boards[0], workspace: this, mode: this._mode });

			boardXIndexes.sort(function(a,b) { return a - b; });
			boardYIndexes.sort(function(a,b) { return a - b; });

			var startXIndex = 1,
				xIndex = 1,
				yIndex = 1;

			if (boardXIndexes.length > 0) startXIndex = boardXIndexes[0];
			if (boardYIndexes.length > 0) yIndex = boardYIndexes[0];

			if (startXIndex == 0) startXIndex++;
			if (yIndex == 0) yIndex++;

			this._boardMap = new BoardMap.Index({ startXIndex: startXIndex, startYIndex: yIndex, workspace: this });

			for (var i=0; i<boardYIndexes.length; i+=1) {
				xIndex = startXIndex;

				if (yIndex == 0) yIndex++;

				var boardRow = this._boardMap.addRow(xIndex, yIndex);

				if (boards[boardYIndexes[i]] != null) {
					for (var j=0; j<boardXIndexes.length; j+=1) {
						if (xIndex == 0) xIndex++;

						if (boards[boardYIndexes[i]][boardXIndexes[j]] != null) boardRow.addColumn(boards[boardYIndexes[i]][boardXIndexes[j]]);
						else boardRow.addColumn(new AddBoard.Index({ workspace: this, positionX: xIndex, positionY: yIndex, location: "body" }));
						
						xIndex++;
					}
				}

				yIndex++;
			}
		},

      	// ********** Build Boards **********

		renderBoards: function() {
			var that = this;

			this.$(".workspace-navigation").hide();
			this.$("#board-container").empty();

			// Now we have the board map we need to determine if we are looking at a single view or the entire map
			if (this._mode == "boardMap") {
				this._boardMap.destroy();

				this._boardMap.render();
				
				this.$("#board-container").html(this._boardMap.$el);
			}
			else if (this._mode == "individual") {
				if (this._selectedBoard) this._selectedBoard.destroy();
				this._selectedBoard = null;

				if (!this._selectedBoardId) this._selectedBoardId = this.model.boards[0].id;

				for (var i=0, boardsLength=this.model.boards.length; i<boardsLength; i+=1) {
					if (this.model.boards[i].id == this._selectedBoardId) {
						this._selectedBoard = new Board.Index({ model: this.model.boards[i], workspace: this, mode: this._mode });
						break;
					}
				}

				if (!this._selectedBoard) this._selectedBoard = new Board.Index({ model: this.model.boards[0], workspace: this, mode: this._mode });

				this._selectedBoard.render();

				this.$("#board-container").html(this._selectedBoard.$el);

				$(window).resize(function(){
				   that._selectedBoard.center();
				});

				var boardPositions = this._boardMap.getTakenPositions(that._selectedBoard.getPositionX(), that._selectedBoard.getPositionY());
					
				if (boardPositions.indexOf("n") !== -1) this.$("#north-board-navigation").show();
				if (boardPositions.indexOf("s") !== -1) this.$("#south-board-navigation").show();
				if (boardPositions.indexOf("e") !== -1) this.$("#east-board-navigation").show();
				if (boardPositions.indexOf("w") !== -1) this.$("#west-board-navigation").show();
			}

			this.renderZoom();
		},

		getBoardItems: function(boardId) {
			var that = this,
				indexesToRemove = [];

			for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
				if (this._boardEntities[i].getBoardId() == boardId) {
					this._boardEntities[i].destroy();
					this._boardEntities[i] = null;

					indexesToRemove.push(i);
				}
			}

			for (var i = indexesToRemove.length-1; i >= 0; i--) {
   				this._boardEntities.splice(indexesToRemove[i], 1);
   			}

			Board_Services.GetCards(boardId, function(response) {
				if (response.code == 200) {
					for (var i=0, boardsLength=that.model.boards.length; i<boardsLength; i+=1) {
						if (that.model.boards[i].id == boardId) {
							var cards = response.board.cards;

							for (var j=0, cardsLength=cards.length; j<cardsLength; j+=1) {
								if (cards[j].cards.length == 0) that.addCardToBoard(cards[j]);
								else that.addClusterToBoard(cards[j]);
							}
						
							break;
						}
					}
				}
			});
		},

		// ********** Zooming **********

		zoomIn: function() {
			if (this._zoom < 1.5) {
				this._zoom += 0.1;
				this._zoom = Math.round(this._zoom * 100) / 100;

				this.renderZoom();

				if (this._zoom === 0.2) {
					for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
						this._boardEntities[i].setVisible();
					}
				}
			}
		},

		zoomOut: function() {
			if (this._zoom > 0.1) {

				this._zoom -= 0.1;
				this._zoom = Math.round(this._zoom * 100) / 100;

				this.renderZoom();

				if (this._zoom === 0.1) {
					for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
						this._boardEntities[i].setHidden();
					}
				}
			}
		},

		renderZoom: function() {
			this.$("#zoom-container").html(Math.round(this._zoom*100) + "%");

			if (this._mode == "boardMap") {
				this._boardMap.setZoom(this._zoom);
				this._boardMap.center();

				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					this._boardEntities[i].unbind();
					this._boardEntities[i].bind();
				}
			}
			else if (this._mode == "individual") {
				this._selectedBoard.setZoom(this._zoom);
				this._selectedBoard.center();

			   	this._selectedBoard.unbind();
			   	this._selectedBoard.unbind();
			}
		},

		// ********** Adding boards **********

		addBoard: function(positionX, positionY) {
			var that = this;
            
            Board_Services.Insert(this.model.id, "New Board", positionX, positionY, function(response) {
            	that.renderNewBoard(response.board)

				that.sendSocket(JSON.stringify({ 
					action:"addBoard", 
					workspace: that.getId(), 
					board: response.board
				}));
            });
		},

		renderNewBoard: function(board) {
			if (board) {
				this.model.boards.push(board);
		        	
				this.model.boards.sort(function (a, b) { 
					return a.positionX > b.positionX ? 1 : a.positionX < b.positionX ? -1 : 0; 
				});

				this.model.boards.sort(function (a, b) { 
					return a.positionY > b.positionY ? 1 : a.positionY < b.positionY ? -1 : 0; 
				});

		    	this._boardMap.addBoardInPosition(board.positionX, board.positionY, new Board.Index({ model: board, workspace: this, mode: this._mode }));
			
		    	if ((this._mode == "individual") && (this._selectedBoard)) {
					var boardSouthPosition = (board.positionY+1),
						boardNorthPosition = (board.positionY-1),
						boardEastPosition = (board.positionX+1),
						boardWestPosition = (board.positionX-1);

					if (boardSouthPosition === 0) boardSouthPosition = -1;
					if (boardNorthPosition === 0) boardNorthPosition = 1;
					if (boardEastPosition === 0) boardEastPosition = 1;
					if (boardWestPosition === 0) boardWestPosition = -1;

					if ((board.positionX === this._selectedBoard.getPositionX()) && (boardSouthPosition === this._selectedBoard.getPositionY())) this.$("#north-board-navigation").show();
					if ((board.positionX === this._selectedBoard.getPositionX()) && (boardNorthPosition === this._selectedBoard.getPositionY())) this.$("#south-board-navigation").show();
					if ((boardWestPosition === this._selectedBoard.getPositionX()) && (board.positionY === this._selectedBoard.getPositionY())) this.$("#east-board-navigation").show();
					if ((boardEastPosition === this._selectedBoard.getPositionX()) && (board.positionY === this._selectedBoard.getPositionY())) this.$("#west-board-navigation").show();
		    	}
		    }
		},

		// ********** Deleting boards **********


		deleteBoard: function(boardId) {
			var that = this;

			Board_Services.Delete(boardId, function(response) {
				if (response.code == 200) {
					that.sendSocket(JSON.stringify({ 
						action:"deleteBoard", 
						workspace: that.model.id,
						board: { 
							id: boardId
						} 
					}));

					that.boardDeleted(boardId);
				}
			});
		},

		boardDeleted: function(boardId) {
			var boardDeleted = false;

			for (var i=(this._boardEntities.length-1); i>=0; i--) {
				if (this._boardEntities[i].getBoardId() == boardId) {
					this._boardEntities[i].destroy();
					this._boardEntities[i] = null;

					this._boardEntities.splice(i,1);
				}
			}

			for (var i=(this.model.boards.length-1); i>=0; i--) {
				if (this.model.boards[i].id == boardId) {
					this.model.boards[i] = null;
					this.model.boards.splice(i,1);

					boardDeleted = true;
					break;
				}
			}

			if (boardDeleted) {
				this.setupWorkspace();
				this.renderBoards();
			}
		},

		// ********** Adding cards **********

		createAddCardDialog: function() {
			var that = this;

			this._addCard = new AddCard.Text({ 
				workspace: this, 
				parent: null, 
				isMobile: this._isMobile 
			});
			this._addCard.render();

			this.$("#card-create-overlay").html(this._addCard.el);

  			document.addEventListener("keydown", function(e) {
  				var charCode = e.charCode || e.keyCode;

  				var valid = (charCode > 47 && charCode < 58) || charCode == 32 || charCode == 13 || (charCode > 64 && charCode < 91) || (charCode > 95 && charCode < 112) || (charCode > 185 && charCode < 193) || (charCode > 218 && charCode < 223);
  				
  				if ((valid) && (!that._blockAddCard) && (that.getDropBoardId() !== -1)) {
					that.showAddCard();
				}
  			}, false);
		},
		
		showAddCard: function() {
    		try {
				this._blockAddCard = true;

				if (this._addCard) {
					this.$("#card-create-overlay").show();
					
					this._addCard.showAddText();
				}	
			}
			catch (err) {
				Utils.sendClientError("showAddCard", err);
			}
		},

		hideAddCard: function() {
    		try {
				this._blockAddCard = false;
				
				if (this._addCard) {
					this._addCard.hide();
					this.$("#card-create-overlay").hide();
				}
			}
			catch (err) {
				Utils.sendClientError("hideAddCard", err);
			}
		},

		cardAdded: function(card) {
    		try {
				var that = this,
					dropBoardId = this.getDropBoardId(),
					xPos = Math.floor(this.$("#board-cards_" + dropBoardId).width()/2)-90,
					yPos = Math.floor(this.$("#board-cards_" + dropBoardId).height()/2);

				if (this._dropPosition) {
					xPos = this._dropPosition.x;
					yPos = this._dropPosition.y;
				}

				var newCard = {
					id: card.id, 
					parentId: null,
					type: card.type,  
					boardId: dropBoardId,
					boardOwner: this.model.owner,	
					title: card.title, 
					content: card.content, 
					isLocked: false, 
					cards: [],
					created: card.created, 
					createdDate: new Date(card.created),
					width: null,
					height: null,
					xPos: (xPos + (this._cardsDroppedInPosition*10)),
					yPos: (yPos + (this._cardsDroppedInPosition*10)),
					color: card.color
				};

				Card_Services.UpdatePosition(this.model.id, dropBoardId, newCard.id, newCard.xPos, newCard.yPos, function() {
					that.sendSocket(JSON.stringify({ 
						action:"updateCardPosition", 
						workspace: that.model.id,
						card: {
				        	id: newCard.id,
				        	boardId: newCard.boardId,
				        	xPos: newCard.xPos,
				        	yPos: newCard.yPos
				        } 
					}));
				});

	        	this._cardsDroppedInPosition++;

				this.addCardToBoard(newCard);
			}
			catch (err) {
				Utils.sendClientError("cardAdded", err);
			}
		},

		// ********** Editing cards **********

		showEditCard: function(cardModel) {
	   		try {
				this._blockAddCard = true;

				if (this._addCard) {
					this._addCard.showEdit(cardModel);

					this.$("#card-create-overlay").show();
				}
			}
			catch (err) {
				Utils.sendClientError("editCard", err);
			}
		},

		cardEdited: function(card) {
	   		try {
		    	this._blockAddCard = false;

		   		if ((card) && (this._boardEntities)) {
					for (var i=0; i<this._boardEntities.length; i++) {
						this._boardEntities[i].updateCardContent(card.id, card.content, card.title, card.color);
					}
		   		}
			}
			catch (err) {
				Utils.sendClientError("editCardComplete", err);
			}
		},

		// ********** Managing board cards **********

		addCardToBoard: function(cardModel) {
			try {
				var card = new Card.Item({ 
					model: CardModel.Generate(cardModel), 
					isMobile: this._isMobile, 
					workspace: this, 
					parent: null 
				});

				card.render();

				this.$("#board-cards_" + cardModel.boardId).append(card.el);

				this._boardEntities.push(card);

				return card;
			}
			catch (err) {
				Utils.sendClientError("addCardToBoard", err);
			}
		},

		addCardToCluster: function(boardId, clusterId, cardId) {
			try {
				var card = null;
				
				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					if ((this._boardEntities[i].getType() == "card") && (this._boardEntities[i].getId() == cardId)) {
						this._boardEntities[i].setBoardId(boardId);
						
						card = this._boardEntities[i].getModel();

						this._boardEntities[i].remove();
	      				this._boardEntities.splice(i, 1);
						break;
					}
					else if (this._boardEntities[i].getType() == "cluster") {
						card = this._boardEntities[i].removeCard(cardId);
						
						if (card) break;
					}
				}

				if (card) {
					for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
						if (this._boardEntities[i].getType() == "cluster") this._boardEntities[i].addCardToCluster(clusterId, CardModel.Generate(card));
					}
				}
			}
			catch (err) {
				Utils.sendClientError("addCardToCluster", err);
			}
		},

		removeCardFromCluster: function(updateDetail) {
			try {
				var sourceCard = null;

				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					if (this._boardEntities[i].getType() == "cluster") sourceCard = this._boardEntities[i].detachAndReturn(updateDetail.cardId);

					if (sourceCard) break;
				}

				if (sourceCard) {
					sourceCard.width = null;
					sourceCard.height = null;
					sourceCard.xPos = updateDetail.xPos;
					sourceCard.yPos = updateDetail.yPos;

					this.addCardToBoard(sourceCard);
				}
			}
			catch (err) {
				Utils.sendClientError("removeCardFromCluster", err);
			}
		},

		removeClusterFromCluster: function(updateDetail) {
			try {
				var sourceCard = null;

				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					if (this._boardEntities[i].getType() == "cluster") sourceCard = this._boardEntities[i].detachAndReturn(updateDetail.cardId);

					if (sourceCard) break;
				}

				if (sourceCard) {
					sourceCard.width = null;
					sourceCard.height = null;
					sourceCard.xPos = updateDetail.xPos;
					sourceCard.yPos = updateDetail.yPos;

					this.addClusterToBoard(sourceCard);
				}
			}
			catch (err) {
				Utils.sendClientError("removeCardFromCluster", err);
			}
		},

		addClusterToBoard: function(clusterModel, cardModel) {
			try {
				var cluster = new Cluster.Item({ 
					model: ClusterModel.Generate(clusterModel), 
					isMobile: this._isMobile, 
					workspace: this, 
					parent: null 
				});

				if (cardModel) {
					if (cardModel.cards === 0) cluster.addCard(CardModel.Generate(cardModel, cluster.getId()));
					else cluster.addCard(ClusterModel.Generate(cardModel, cluster.getId()));
				} 

				cluster.render();

				this.$("#board-cards_" + clusterModel.boardId).append(cluster.el);

				this._boardEntities.push(cluster);

				return cluster;
			}
			catch (err) {
				Utils.sendClientError("addClusterToBoard", err);

				return null;
			}
		},

		addClusterToCluster: function(boardId, targetClusterId, sourceClusterId) {
			try {
				var cluster = null;
				
				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					if ((this._boardEntities[i].getType() == "cluster") && (this._boardEntities[i].getId() == sourceClusterId)) {
						this._boardEntities[i].setBoardId(boardId);

						cluster = this._boardEntities[i].getModel();

						this._boardEntities[i].remove();
	      				this._boardEntities.splice(i, 1);
						break;
					}
					else if (this._boardEntities[i].getType() == "cluster") {
						cluster = this._boardEntities[i].removeCard(sourceClusterId);
						
						if (cluster) break;
					}
				}

				if (cluster) {
					for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
						if (this._boardEntities[i].getType() == "cluster") this._boardEntities[i].addClusterToCluster(targetClusterId, ClusterModel.Generate(cluster));
					}
				}
			}
			catch (err) {
				Utils.sendClientError("addClusterToCluster", err);
			}
		},

		setCardToCluster: function(boardId, sourceCardId, targetCardId) {
			var that = this,
				clusterModel = {
	  				id: targetCardId,
	  				boardId: boardId,
	  				action: "create",
	  				cards: [{ id: sourceCardId }]
	  			};

  			Cluster_Services.Insert(this.model.id, boardId, targetCardId, clusterModel, function() {
  				that.createClusterFromCard(boardId, sourceCardId, targetCardId);

  				that._socket.send(JSON.stringify({ 
  					action:"createClusterFromCard", 
  					workspace: that.model.id, 
  					cluster: {
  						boardId: boardId, 
  						sourceCardId: sourceCardId, 
  						targetCardId: targetCardId
  					} 
  				}));
  			});
		},

		createClusterFromCard: function(boardId, sourceCardId, targetCardId) {
			try {
				var that = this,
					sourceCard = null,
					targetCard = null;

				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					if ((this._boardEntities[i].getType() == "card") && (this._boardEntities[i].getId() == sourceCardId)) {
						sourceCard = this._boardEntities[i].getModel();

						this._boardEntities[i].remove();
	      				this._boardEntities.splice(i, 1);

	      				break;
					}
					else if (this._boardEntities[i].getType() == "cluster") {
						sourceCard = this._boardEntities[i].removeCard(sourceCardId);

						if (sourceCard) break;
					}
				}

				if (sourceCard) {
					for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
						if ((this._boardEntities[i].getType() == "card") && (this._boardEntities[i].getId() == targetCardId)) {
							targetCard = this._boardEntities[i].getModel();

							this._boardEntities[i].remove();
		      				this._boardEntities.splice(i, 1);
		
		      				break;
						}
					}

					if (targetCard) {
			  			this.addClusterToBoard(targetCard, sourceCard);

						this.sortZIndexes(targetCard.id, true);
					}
				}
			}
			catch (err) {
				Utils.sendClientError("createClusterFromCard", err);
			}
		},

		createClusterFromCluster: function(boardId, sourceClusterId, targetCardId) {
			try {
				var that = this,
					sourceCluster = null,
					targetCard = null;

				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					if ((this._boardEntities[i].getType() == "cluster") && (this._boardEntities[i].getId() == sourceClusterId)) {
						sourceCluster = this._boardEntities[i].getModel();

						this._boardEntities[i].remove();
	      				this._boardEntities.splice(i, 1);

	      				break;
					}
					else if (this._boardEntities[i].getType() == "cluster") {
						sourceCluster = this._boardEntities[i].removeCard(sourceClusterId);

						if (sourceCluster) break;
					}
				}

				if (sourceCluster) {
					for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
						if ((this._boardEntities[i].getType() == "card") && (this._boardEntities[i].getId() == targetCardId)) {
							targetCard = this._boardEntities[i].getModel();

							this._boardEntities[i].remove();
		      				this._boardEntities.splice(i, 1);
		
		      				break;
						}
					}

					if (targetCard) {
			  			var clusterModel = {
			  				id: targetCard.id,
			  				boardId: boardId,
			  				action: "create",
			  				cards: [{ id: sourceCluster.id }]
			  			};

			  			Cluster_Services.Insert(this.model.id, boardId, targetCard.id, clusterModel, function() {
			  				that._socket.send(JSON.stringify({ 
			  					action:"createClusterFromCluster", 
			  					workspace: that.model.id, 
			  					cluster: clusterModel 
			  				}));
			  			});

			  			sourceCluster.collapsed = true;

			  			var cluster = this.addClusterToBoard(targetCard, sourceCluster);

						this.sortZIndexes(targetCard.id, true);
					}
				}
			}
			catch (err) {
				Utils.sendClientError("createClusterFromCluster", err);
			}
		},

		removeCardFromBoard: function(card) {
			try {
				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					if (this._boardEntities[i].getId() == card.id) {
						this._boardEntities[i].remove();
	      				this._boardEntities.splice(i, 1);
	      				break;
					}
				}
			}
			catch (err) {
				Utils.sendClientError("editCardComplete", err);
			}
		},

		setClusterToCard: function(clusterId) {
			try {
				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
					if (this._boardEntities[i].getType() == "cluster") {
						if (this._boardEntities[i].getId() == clusterId) {
							var cardModel = this._boardEntities[i].getModel();

							this._boardEntities[i].remove();
							this._boardEntities[i] = null;
							this._boardEntities.splice(i, 1);

							Cluster_Services.StopDotVoting(this.model.id, this._selectedBoard.getId(), clusterId);

							this.addCardToBoard(cardModel);
							break;
						}
					}
				}
			}
			catch (err) {
				Utils.sendClientError("createClusterFromCluster", err);
			}
		},
		
		// ---- Move the board that a card exists on
		moveCardBoard: function(cardId, targetBoardId, targetBoardXPos, targetBoardYPos) {
			for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i+=1) {
				if (this._boardEntities[i].getId() == cardId) {								
					this._boardEntities[i].setBoardId(targetBoardId);
					this._boardEntities[i].setXPos(targetBoardXPos);
					this._boardEntities[i].setYPos(targetBoardYPos);

					this._boardEntities[i].destroy();
					this._boardEntities[i].render();

					this.$("#board-cards_" + targetBoardId).append(this._boardEntities[i].el);

					break;
				}
			}
		},

		sortZIndexes: function(elementId, publish) {
			try {
				var that = this,
					boardId = null,
					lockedElements = new Array(),
					unlockedElements = new Array();

				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i++) {
					if ((elementId) && (this._boardEntities[i].getId() == elementId)) {
						boardId = this._boardEntities[i].getBoardId();

						this._boardEntities[i].setZPos(999999999999999);
					}

					if (this._boardEntities[i].getIsLocked()) lockedElements.push(this._boardEntities[i]);
					else unlockedElements.push(this._boardEntities[i]);
	    		}

				lockedElements.sort(function (a, b) { 
					return a.getZPos() > b.getZPos() ? 1 : a.getZPos() < b.getZPos() ? -1 : 0;
				});
				unlockedElements.sort(function (a, b) { 
					return a.getZPos() > b.getZPos() ? 1 : a.getZPos() < b.getZPos() ? -1 : 0; 
				});

				var sortedCards = new Array();

				for (var i=0; i<lockedElements.length; i++) {
					sortedCards.push({
						cardId: lockedElements[i].getId(),
						zPos: i
					});

					lockedElements[i].setZIndex(i);
				}

				$("#page-canvas_" + this.model.id).zIndex(lockedElements.length);

				for (var i=0; i<unlockedElements.length; i++) {
					sortedCards.push({
						cardId: unlockedElements[i].getId(),
						zPos: (i+(lockedElements.length+1))
					});

					unlockedElements[i].setZIndex((i+(lockedElements.length+1)));
				}

				if ((boardId) && (elementId) && (publish)) {
					Board_Services.UpdateCardZIndexes(this.model.id, boardId, sortedCards, function(response) {
		            	that._socket.send(JSON.stringify({ 
		            		action:"sortZIndexes", 
		            		board: boardId, 
		            		card: { id: elementId } 
		            	}));
	            	});
	        	}
			}
			catch (err) {
				Utils.sendClientError("sortZIndexes", err);
			}
		},

		// ********** Positional Methods **********

		// ---- Check if a board exists at a specified X/Y position
		checkBoardPosition: function(xPos,yPos) {
			try {
				if (this._mode == "individual") return this._boardMap.getBoardInRelativePosition(xPos-this._selectedBoard.getRelativeXPos(), yPos-this._selectedBoard.getRelativeYPos());
				else return this._boardMap.getBoardInRelativePosition(xPos-this.$("#table-container").position().left,yPos-this.$("#table-container").position().top);
			}
			catch (err) {
				Utils.sendClientError("checkPositionTaken", err);
			}
		},

		//  ---- Check if an element exists at the specified position
		checkPositionTaken: function(boardId,elementId,xPos,yPos) {
			try {
				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i++) {
					if ((this._boardEntities[i].getBoardId() == boardId) && (this._boardEntities[i].getId() != elementId)) {
						var xPosStart = this._boardEntities[i].getXPos(),
							xPosEnd = xPosStart + this._boardEntities[i].$el.width(),
							yPosStart = this._boardEntities[i].getYPos(),
							yPosEnd = yPosStart + this._boardEntities[i].$el.height();

	 					if (((xPos > xPosStart) && (xPos < xPosEnd)) && 
	 						((yPos > yPosStart) && (yPos < yPosEnd))) {
							if ((!this._boardEntities[i].getWidth()) && (!this._boardEntities[i].getHeight())) return this._boardEntities[i].getId();
	 					}
					}
				}
				
				return -1;
			}
			catch (err) {
				Utils.sendClientError("checkPositionTaken", err);
			}
		},

		// ********** Random Utils **********
				
		removePopups: function(calledBy) {
			if (calledBy != "authenticate") {
				this.$("#authenticate-user-container").remove();
			}
			
			if (calledBy != "saveAs") {
				this.$("#save-as-board-container").remove();
			}

			if (this._boardEntities) {
				for (var i=0, boardEntitiesLength=this._boardEntities.length; i<boardEntitiesLength; i++) {
					this._boardEntities[i].clearSettingsmenu();

					if (this._boardEntities[i].getType() == "card") this._boardEntities[i].stopCardResize();
				}
			}
		},

		// {{ Web Sockets }}

		sendSocket: function(package) {
			this._socket.send(package);
		},

		connectSockets: function() {
			var that = this;

			if (this._socket != null) {
				try
				{
					console.log("Retrying websocket connection");
				}
				catch (er) {}

    			this._socket.removeAllListeners();
    			this._socket = null;
			}

			this._socket = eio("http://localhost:8080?random=" + new Date().getTime());

			// Handle socket actions

		  	this._socket.on("open", function() {
		  		try
		  		{
		  			console.log("Connected to websocket");
				}
				catch (er) {}

				that._socket.send(JSON.stringify({ workspace: that.model.id, action: "Establishing connection" }));

			    that._socket.on("message", function(package) {
			  		that._connectionAttempts = 0;

			  		if (!that._boardBuilt) {

			      		// Render the board items
			        	that.renderBoards();

						that.createAddCardDialog();

			  			that._boardBuilt= true;
			  		}

			  		var socketPackage = null;

			  		try {
			    		socketPackage = JSON.parse(package);
			    	}
			    	catch (err) {
			    		try {
				    		console.log("Error parsing data packag: " + err);
				    	}
				    	catch (err) {}
			    	}

			    	if ((socketPackage != null) && (socketPackage.action != null)) {
			    		try {
			    			switch(socketPackage.action) {
			    				case "addBoard":
			    					var board = socketPackage.board,
			    						boardExists = false;

			    					if (that._boardMap) boardExists = (that._boardMap.getBoard(board.id) !== null);

			    					if (!boardExists) that.renderNewBoard(board)
			    					break;
			    				case "deleteBoard":
			    					var board = socketPackage.board,
			    						boardExists = false;

			    					if (that._boardMap) boardExists = (that._boardMap.getBoard(board.id) !== null);

			    					if (boardExists) that.boardDeleted(board.id);
			    					break;
								case "boardCardAdded":
			    					var card = socketPackage.card,
			    						cardExists = false;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getId() == card.id) {
												cardExists = true;
												break;
											}
										}
									}

									if (!cardExists) that.addCardToBoard(card);
								break;
								case "boardCardUpdated":
			    					var card = socketPackage.card;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											that._boardEntities[i].updateCardContent(card.id, card.content, card.title, card.color);
										}
									}
								break;
								case "boardCardDeleted":
			    					var card = socketPackage.card;

									that.removeCardFromBoard(card);

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (this._boardEntities[i].getType() == "cluster") that._boardEntities[i].removeCard(card);
										}
									}
								break;
								case "updateCardPosition":
		    						var card = socketPackage.card;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getId() == card.id) {
												if (that._boardEntities[i].getBoardId() != card.boardId) that.moveCardBoard(card.id, card.boardId, card.xPos, card.yPos);

												that._boardEntities[i].setCardPosition(card.id, card.xPos, card.yPos); 
											}
										}
									}
								break;
								case "updateCardSize":
		    						var size = socketPackage.size;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getId() == size.id) that._boardEntities[i].setCardSize(size.id,size.width,size.height);
										}
									}
					    			break;
					    		case "undoCardResize":
		    						var size = socketPackage.size;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getId() == size.id) that._boardEntities[i].setCardUnsized();
										}
									}
					    			break;
								case "lockCard":
		    						var card = socketPackage.card;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if ((that._boardEntities[i].getType() == "card") && (that._boardEntities[i].getId() == card.id)) that._boardEntities[i].setCardLocked();
										}
									}
				    			break;
								case "unlockCards":
		    						var card = socketPackage.card;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if ((that._boardEntities[i].getType() == "card") && (that._boardEntities[i].getId() == card.id) && (that._boardEntities[i].getIsLocked())) that._cardViews[i].setCardUnlocked();
										}
									}
								break;
								case "boardClusterUpdated":
		    						var cluster = socketPackage.cluster;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getType() == "cluster") that._boardEntities[i].updateClusterTitle(cluster.id, cluster.title, cluster.content);
										}
									}
				    			break;
								case "updateClusterPosition":
		    						var cluster = socketPackage.cluster;

		    						if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getId() == cluster.id) {
												if (that._boardEntities[i].getBoardId() != cluster.boardId) that.moveCardBoard(cluster.id, cluster.boardId, cluster.xPos, cluster.yPos);

												that._boardEntities[i].setClusterPosition(cluster.id, cluster.xPos, cluster.yPos); 
											}
										}
									}
								break;
					    		case "expandCluster":
									var cluster = socketPackage.cluster;

									if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getType() == "cluster") that._boardEntities[i].expandCluster(cluster.id);
										}
									}
				    			break;
					    		case "collapseCluster":
									var cluster = socketPackage.cluster;

									if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getType() == "cluster") that._boardEntities[i].collapseCluster(cluster.id);
										}
									}
				    			break;
								case "sortCluster":
					    			var sortOrder = socketPackage.sortOrder;

									if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if ((that._boardEntities[i].getType() == "cluster") && (that._boardEntities[i].getId() == sortOrder.clusterId)) that._boardEntities[i].updateSortPosition(sortOrder.cards);
										}
									}
								break;
					    		case "startDotVoting":
		    						var cluster = socketPackage.cluster;

									if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if ((that._boardEntities[i].getType() == "cluster") && (that._boardEntities[i].getId() == cluster.id)) that._boardEntities[i].displayStartDotVoting();
										}
									}
					    			break;
					    		case "stopDotVoting":
		    						var cluster = socketPackage.cluster;

									if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if ((that._boardEntities[i].getType() == "cluster") && (that._boardEntities[i].getId() == cluster.id)) that._boardEntities[i].displayStopDotVoting();
										}
									}
					    			break;
								case "addVote":
		    						var vote = socketPackage.vote;

									if (that._boardEntities) {
										for (var i=0, boardEntitiesLength=that._boardEntities.length; i<boardEntitiesLength; i++) {
											if (that._boardEntities[i].getId() == vote.cluster) {
												that._boardEntities[i].updateChildVotes(vote.card);
											}
										}
									}
								break;
								case "createClusterFromCard":
									var clusterDetail = socketPackage.cluster;

									that.createClusterFromCard(clusterDetail.boardId, clusterDetail.sourceCardId, clusterDetail.targetCardId);
									break;
								case "addCardToCluster":
		    						var updateDetail = socketPackage.updateDetail;

		    						that.addCardToCluster(updateDetail.boardId, updateDetail.clusterId, updateDetail.cardId);
									break;
								case "removeCardFromCluster":
		    						var updateDetail = socketPackage.updateDetail;

		    						that.removeCardFromCluster(updateDetail);
								break;
								case "addClusterToCluster":
		    						var updateDetail = socketPackage.updateDetail;

		    						that.addClusterToCluster(updateDetail.boardId, updateDetail.targetClusterId, updateDetail.sourceClusterId);
								break;
								case "removeClusterFromCluster":
		    						var updateDetail = socketPackage.updateDetail;

		    						that.removeClusterFromCluster(updateDetail);
								break;
			    			}
			    		}	
						catch (err) {
							Utils.sendClientError("connectSockets", err);
						}
			    	}
			    });

			  	that._socket.on("close", function() {
			  		try
			  		{
			  			console.log("Disconnected from websocket");
					}
					catch (er) {}

			  		if (that._attemptReconnect) {
				  		that._connectionAttempts++;

				  		if (that._connectionAttempts < 10) {
				  			console.log(that._connectionAttempts);
		        			that.connectSockets();
				  		}
			  		}
			  	});

			  	that._socket.on("error", function() {
			  		try
			  		{
			  			console.log("Error with websocket");
					}
					catch (er) {}

			  		if (that._attemptReconnect) {
				  		that._connectionAttempts++;

				  		if (that._connectionAttempts < 10) {
				  			console.log(that._connectionAttempts);
		        			that.connectSockets();
				  		}
			  		}
			  	});
			});
		},

		closeSockets: function() {
        	this._attemptReconnect = false;
        	
			this._socket.close();

			this._socket.removeAllListeners();
			this._socket = null;
		}
	});

	// ===== View of workspace on main page

	Workspace.List = Backbone.View.extend({
    	el: "<tr>",

		initialize: function(options) {
			this.render();

			this.parent = options.parent;
      	},

		render: function(){
			var that = this;

			$.get("/app/templates/workspace/list.html", function(contents) {
				that.$el.html(_.template(contents, that.model));

				that.afterRender();

				that.bindEvents();
			}, "text");
		},

		afterRender: function() {
			if (!this.model.isOwner) this.$("#workspace-share_" + this.model.id);
		},

		bindEvents: function() {
			var that = this;

			this.$el.click(function(e) {
				e.stopPropagation();
				e.preventDefault();

				that.parent.viewWorkspace(that.model.id);
			});
		}
	});

	return Workspace;
});