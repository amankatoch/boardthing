define([
	"modules/board.add",
	"modules/board",
	"modules/board.placeholder",
	"modules/css.helpers",
	"modules/board.services",
	"modules/workspace.services",
	"jquery",
	"jqueryUI"
],

function(AddBoard, Board, Placeholder, CSSHelpers, Board_Services, Workspace_Services) {
	var BoardMap = {};

	//////////////////////// Views

	// ===== View for viewing a workspace via the board map

	BoardMap.Index = Backbone.View.extend({
		el: "<div>",
	
		_rows: [],

		_topEdgeRow: null,
		_bottomEdgeRow: null,

    	// {{ Contructor }}

		initialize: function(options) {
			this.el.id = "table-container";
			this.el.className = "table-container";

			this._startXIndex = options.startXIndex;
			this._startYIndex = options.startYIndex;

			this._workspace = options.workspace;

			this._rows = [];

			this._topEdgeRow = null;
			this._bottomEdgeRow = null;
		},

		// {{ Object Building }}

		render: function() {
			if (this._rows.length > 0) {
				// Top edge add button row

				if (this._topEdgeRow) {
					this._topEdgeRow.destroy();
					this._topEdgeRow = null;
				}

				var topRowColumns = this._rows[0].getColumns();

				var yIndex = this._startYIndex-1;
				if (yIndex == 0) yIndex = -1;

				this._topEdgeRow = new BoardMap.EdgeRow({ xIndex: this._startXIndex, yIndex: yIndex, workspace: this._workspace });

				for (var i=0, topRowColumnsLength=topRowColumns.length; i<topRowColumnsLength; i+=1) {
					if (topRowColumns[i].getType() == "board") this._topEdgeRow.addAddColumn("n");
					else this._topEdgeRow.addPlaceholderColumn();
				}

				this._topEdgeRow.render();

            	this.$el.append(this._topEdgeRow.$el);

            	// Main body layout

	            for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
	            	this._rows[i].render();

	            	this.$el.append(this._rows[i].$el);

	            	yIndex++;
	            }

				// Bottom edge add button row

				if (this._bottomEdgeRow) {
					this._bottomEdgeRow.destroy();
					this._bottomEdgeRow = null;
				}

	            yIndex++;
				if (yIndex >= 0) yIndex++;

				this._bottomEdgeRow = new BoardMap.EdgeRow({ xIndex: this._startXIndex, yIndex: yIndex, workspace: this._workspace });

				var bottomRowColumns = this._rows[this._rows.length-1].getColumns();

				for (var i=0, bottomRowColumnsLength=bottomRowColumns.length; i<bottomRowColumnsLength; i+=1) {
					if (bottomRowColumns[i].getType() == "board") this._bottomEdgeRow.addAddColumn("s");
					else this._bottomEdgeRow.addPlaceholderColumn();
				}

				this._bottomEdgeRow.render();

            	this.$el.append(this._bottomEdgeRow.$el);
			}

            this.center();
		},

		// {{ Getters }}

		getBoard: function(boardId) {
            for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
            	var boards = this._rows[i].getBoards();

            	for (var j=0, boardsLength = boards.length; j<boardsLength; j+=1) {
            		if (boards[j].getId() == boardId) return boards[j];
            	}
            }

            return null;
		},

		getAvailablePositions: function(xPos, yPos) {
			var availablePositionsArray = [],
				availablePositions = this.getAvailableBoardPositions(xPos, yPos);

			if (availablePositions.north) availablePositionsArray.push("n");
			if (availablePositions.south) availablePositionsArray.push("s");
			if (availablePositions.east) availablePositionsArray.push("e");
			if (availablePositions.west) availablePositionsArray.push("w");

			return availablePositionsArray;
		},

		getTakenPositions: function(xPos, yPos) {
			var availablePositionsArray = [],
				availablePositions = this.getAvailableBoardPositions(xPos, yPos);

			if (!availablePositions.north) availablePositionsArray.push("n");
			if (!availablePositions.south) availablePositionsArray.push("s");
			if (!availablePositions.east) availablePositionsArray.push("e");
			if (!availablePositions.west) availablePositionsArray.push("w");

			return availablePositionsArray;
		},

		getBoardAtIndex: function(xPos, yPos) {
            for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
            	if (this._rows[i].getYIndex() === yPos) {
	            	var boards = this._rows[i].getBoards();

        			for (var j=0, boardsLength = boards.length; j<boardsLength; j+=1) {
	            		if (boards[j].getPositionX() === xPos) return boards[j];
        			}
        		}
        	}

        	return null;
		},

		getAvailableBoardPositions: function(xPos, yPos) {
			var northAvailable = true,
				southAvailable = true,
				eastAvailable = true,
				westAvailable = true;

            for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
            	if (this._rows[i].getYIndex() === yPos) {
	            	var boards = [];

	            	if (i !== 0) {
	            		boards = this._rows[i-1].getBoards();

            			for (var j=0, boardsLength = boards.length; j<boardsLength; j+=1) {
	            			if (boards[j].getPositionX() === xPos) {
	            				northAvailable = false;
	            				break;
	            			}
	            		}
	            	}

            		boards = this._rows[i].getBoards();

        			for (var j=0, boardsLength = boards.length; j<boardsLength; j+=1) {
            			if ((((xPos-1) !== 0) && (boards[j].getPositionX() === (xPos-1))) || (((xPos-1) === 0) && (boards[j].getPositionX() === -1))) westAvailable = false;
            			if ((((xPos+1) !== 0) && (boards[j].getPositionX() === (xPos+1))) || (((xPos+1) === 0) && (boards[j].getPositionX() === 1))) eastAvailable = false;
            		}

            		if ((i+1) < this._rows.length) {
	            		boards = this._rows[i+1].getBoards();

            			for (var j=0, boardsLength = boards.length; j<boardsLength; j+=1) {
	            			if (boards[j].getPositionX() === xPos) {
	            				southAvailable = false;
	            				break;
	            			}
	            		}
            		}

            		break;
				}
			}

			return {
				north: northAvailable,
				south: southAvailable,
				east: eastAvailable,
				west: westAvailable
			};
		},

		getBoardInPosition: function(xPos, yPos) {
            for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
            	var boards = this._rows[i].getBoards();

            	for (var j=0, boardsLength = boards.length; j<boardsLength; j+=1) {
            		var boardStartX = boards[j].getXPos(),
            			boardEndX = boardStartX+this._workspace.getBoardWidth(),
            			boardStartY = boards[j].getYPos(),
            			boardEndY = boardStartY+this._workspace.getBoardHeight();

 					if (((xPos > boardStartX) && (xPos < boardEndX)) && 
 						((yPos > boardStartY) && (yPos < boardEndY))) return boards[j];
        		}
            }

            return null;
		},

		getBoardInRelativePosition: function(xPos, yPos) {
            for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
            	var boards = this._rows[i].getBoards();

            	for (var j=0, boardsLength = boards.length; j<boardsLength; j+=1) {
            		var boardStartX = boards[j].getRelativeXPos(),
            			boardEndX = boardStartX+this._workspace.getBoardWidth(),
            			boardStartY = boards[j].getRelativeYPos(),
            			boardEndY = boardStartY+this._workspace.getBoardHeight();

 					if (((xPos > boardStartX) && (xPos < boardEndX)) && 
 						((yPos > boardStartY) && (yPos < boardEndY))) return boards[j];
        		}
            }

            return null;
		},

		// {{ Setters }}

		setZoom: function(zoom) {
			CSSHelpers.setZoom(this.$el, zoom);
		},

		// {{ Public Methods }}

		addBoardInPosition: function(xPos, yPos, board) {
			var newRow = false,
				rowIndex = -1,
				newColumn = false,
				columnIndex = -1;

			if (this._rows.length > 0) {
	            for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
					if ((i === 0) && (this._rows[i].getYIndex() > yPos)) {
						this.addRow(this._startXIndex, yPos, 0);

						this._startYIndex--;
						if (this._startYIndex === 0) this._startYIndex--;

						rowIndex = 0;
						newRow = true;
						break;
					}
					else if (this._rows[i].getYIndex() == yPos) {
						rowIndex = i;
						break;
					}
				}

				if (rowIndex === -1) {
					this.addRow(this._startXIndex, yPos, this._rows.length);
					rowIndex = this._rows.length-1;
					newRow = true;
				}
			}
			else {
				this.addRow(this._startXIndex, yPos, 0);
						
				this._startYIndex = yPos;

				rowIndex = 0;
				newRow = true;
			}

			if (rowIndex != -1) {
				if (newRow) {
					var referenceColumns = [];

					if (rowIndex == 0) referenceColumns = this._rows[1].getColumns();
					else referenceColumns = this._rows[rowIndex-1].getColumns();

	            	for (var i=0, referenceColumnsLength = referenceColumns.length; i<referenceColumnsLength; i+=1) {
	        			this._rows[rowIndex].addColumnAtPosition(i, new AddBoard.Index({ 
	        				workspace: this._workspace, 
	        				positionX: referenceColumns[i].getPositionX(), 
	        				positionY: this._rows[rowIndex].getYIndex(), 
	        				location: "body" 
	        			}));
	        		}
				}

				if (xPos < this._startXIndex) {
					this._rows[rowIndex].addColumnAtPosition(0, board);
					
					this._startXIndex--;
					if (this._startXIndex === 0) this._startXIndex--;

					columnIndex = 0;
					newColumn = true;
				}
				else {
					var rowColumns = this._rows[rowIndex].getColumns(),
						columnFound = false;

	            	for (var i=0, rowColumnsLength = rowColumns.length; i<rowColumnsLength; i+=1) {
            			if (rowColumns[i].getPositionX() === xPos) {
            				this._rows[rowIndex].replaceColumnAtPosition(i, board);
            				columnFound = true;
            			}
	            	}

	            	if (!columnFound) {
	            		this._rows[rowIndex].addColumnAtPosition(rowColumns.length, board);

						columnIndex = rowColumns.length;
						newColumn = true;
	            	}
				}

				if (newColumn) {
	            	for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
	            		if (i != rowIndex) {
	            			if (columnIndex === 0) this._rows[i].addColumnAtPosition(0, new AddBoard.Index({ workspace: this._workspace, positionX: this._startXIndex, positionY: this._rows[i].getYIndex(), location: "body" }));
							else {
								this._rows[i].addColumnAtPosition(this._rows[rowIndex].getColumns().length, new AddBoard.Index({ workspace: this._workspace, positionX: this._rows[rowIndex].getColumns()[(rowColumns.length-1)].getPositionX(), positionY: this._rows[i].getYIndex(), location: "body" }));
		            		}
		            	}

						this._rows[i].setXIndex(this._startXIndex);
	            	}
	            }
			}

			if (this._workspace.getMode().toLowerCase() == "boardmap") {
				this.destroyRows();
				this.render();
			}
		},

		addRow: function(xIndex, yIndex, position) {
			var boardRow = new BoardMap.Row({ xIndex: xIndex, yIndex: yIndex, parent: this, workspace: this._workspace });

			if (position == null) position = this._rows.length;

			if (position == this._rows.length) this._rows.push(boardRow)
			else this._rows.splice(position, 0, boardRow);

			return boardRow;
		},

		center: function() {
			CSSHelpers.center(this.$el, this._workspace.getZoom());
		},

		destroyRows: function() {
			if (this._topEdgeRow) this._topEdgeRow.destroy();
			if (this._bottomEdgeRow) this._bottomEdgeRow.destroy();

            for (var i=0, rowsLength = this._rows.length; i<rowsLength; i+=1) {
            	this._rows[i].destroy();
            }
        },

		destroy: function() {
			this.destroyRows();

			$(this.el).detach();
			this.remove();
		}
	});
	
  	BoardMap.EdgeRow = Backbone.View.extend({
		el: "<div>",

		_columns: [],

		_index: -1,

    	// {{ Contructor }}

		initialize: function(options) {
			this._xIndex = options.xIndex;
			this._yIndex = options.yIndex;

			this.el.id = "board-row_" + this._yIndex;
			this.el.className = "row";

			this._workspace = options.workspace;

			this._columns = [];

			this._columns.push(new Placeholder.Index({ width: 100, height: 100 }));
			this._columns.push(new Placeholder.Index({ width: 100, height: 100 }));
		},

		// {{ Object Building }}

		render: function() {			
            for (var i=0, columnsLength = this._columns.length; i<columnsLength; i+=1) {
            	this._columns[i].render();

            	this.$el.append(this._columns[i].$el);
            }
        },

		// {{ Public Methods }}

		addPlaceholderColumn: function() {
			this._columns.splice((this._columns.length-1), 0, new Placeholder.Index({ width: this._workspace.getBoardWidth(), height: 100 }));
			this._xIndex++;
			if (this._xIndex == 0) this._xIndex++;
		},

		addAddColumn: function(location) {
			this._columns.splice((this._columns.length-1), 0, new AddBoard.Index({ positionX: this._xIndex, positionY: this._yIndex, location: location, workspace: this._workspace }));
			this._xIndex++;
			if (this._xIndex == 0) this._xIndex++;
		},

		destroy: function() {
            for (var i=0, columnsLength = this._columns.length; i<columnsLength; i+=1) {
            	this._columns[i].destroy();
            	this._columns[i] = null;
            }

            this._columns = [];

			$(this.el).detach();
			this.remove();
		}
  	});
	
  	BoardMap.Row = Backbone.View.extend({
		el: "<div>",

		_index: -1,

		_columns: [],
		_edgeAddBoards: [],

    	// {{ Contructor }}
	
		initialize: function(options) {
			this._xIndex = options.xIndex; 
			this._yIndex = options.yIndex;

			this.el.id = "board-row_" + this._yIndex;
			this.el.className = "row";

			this._parent = options.parent;
			this._workspace = options.workspace;

			this._columns = [];
			this._edgeAddBoards = [];
		},

		// {{ Object Building }}

		render: function() {
			var startPositionX = this._xIndex-1;
			if (startPositionX == 0) startPositionX = -1;

			if (this._columns[0].getType() == "board") this._edgeAddBoards.push(new AddBoard.Index({ positionX: startPositionX, positionY: this._yIndex, location: "w", workspace: this._workspace }));
			else this._edgeAddBoards.push(new Placeholder.Index({ width: 100, height: this._workspace.getBoardHeight() }));
			
			this.$el.append(this._edgeAddBoards[(this._edgeAddBoards.length-1)].$el);
			
            for (var i=0, columnsLength = this._columns.length; i<columnsLength; i+=1) {
            	startPositionX++;
            	if (startPositionX === 0) startPositionX = 1;

            	this._columns[i].render();

            	this.$el.append(this._columns[i].$el);
            }

			if (this._columns[(this._columns.length-1)].getType() == "board") {
            	startPositionX++;
            	if (startPositionX === 0) startPositionX = 1;

				this._edgeAddBoards.push(new AddBoard.Index({ positionX: startPositionX, positionY: this._yIndex, location: "e", workspace: this._workspace }));
			}
			else this._edgeAddBoards.push(new Placeholder.Index({ width: 100, height: this._workspace.getBoardHeight() }));

			this.$el.append(this._edgeAddBoards[(this._edgeAddBoards.length-1)].$el);

			this.$el.css({ height: this._workspace.getBoardHeight() });
        },

		// {{ Getters }}

		getYIndex: function() {
			return this._yIndex;
		},

		getColumns: function() {
			return this._columns;
		},

        getBoards: function() {
        	var boards = [];

            for (var i=0, columnsLength = this._columns.length; i<columnsLength; i+=1) {
            	if (this._columns[i].getType() == "board") boards.push(this._columns[i]);
            }

        	return boards;
        },

		// {{ Setters }}

		setXIndex: function(xIndex) {
			this._xIndex = xIndex;
		},

        getColumnCount: function() {
        	return this._columns.length;
        },

		// {{ Public Methods }}

		addColumn: function(boardColumn) {
			this._columns.push(boardColumn);
		},

		addColumnAtPosition: function(xIndex, boardColumn) {
			if (xIndex == this._columns.length) this._columns.push(boardColumn);
			else this._columns.splice(xIndex, 0, boardColumn);
		},

		replaceColumnAtPosition: function(xIndex, boardColumn) {
			this._columns[xIndex].destroy();

			this._columns[xIndex] = boardColumn;
		},

		destroy: function() {
            for (var i=0, columnsLength = this._columns.length; i<columnsLength; i+=1) {
            	this._columns[i].destroy();
            }

            for (var i=0, columnsLength = this._edgeAddBoards.length; i<columnsLength; i+=1) {
            	this._edgeAddBoards[i].destroy();
            }

			$(this.el).detach();
			this.remove();
		}
	});

	return BoardMap;
});