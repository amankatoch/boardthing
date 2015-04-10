define(["jquery"],

function() {
	var AddBoard = {};

	AddBoard.Index = Backbone.View.extend({
		el: "<div>",

    	// {{ Contructor }}
	
		initialize: function(options) {
			this.el.id = "add-board_" + options.positionY + "_" + options.positionX;
			this.el.className = "add-board cell";

			this._positionX = options.positionX;
			this._positionY = options.positionY;
			
			this._location = options.location;
			this._workspace = options.workspace;
		
			if ((this._location == "n") || (this._location == "s")) {
				this._width = this._workspace.getBoardWidth();
				this._height = 100;
			}
			else if ((this._location == "e") || (this._location == "w")) {
				this._width = 100;
				this._height = this._workspace.getBoardHeight();
			}
			else if (this._location == "body") {
				this._width = this._workspace.getBoardWidth();
				this._height = this._workspace.getBoardHeight();
			}

			this.$el.width(this._width);
			this.$el.height(this._height);

			this.render()
		},

		// {{ Object Building }}

		render: function() {
			var that = this;

			$.get("/app/templates/board.add/index.html", function(contents) {
				that.$el.html(_.template(contents, { positionX: that._positionX, positionY: that._positionY } ));

				that.afterRender();

				that.unbind();
				that.bind();
			}, "text");
		},

		afterRender: function() {
			this.$("#add-button-south_" + this._positionY + "_" + this._positionX).width(this._width-1);
			this.$("#add-button-north_" + this._positionY + "_" + this._positionX).width(this._width-1);
			this.$("#add-button-east_" + this._positionY + "_" + this._positionX).height(this._height);
			this.$("#add-button-west_" + this._positionY + "_" + this._positionX).height(this._height);

			if ((this._location == "n") || (this._location == "s")) {
				if (this._location == "n") this.$("#add-button-south_" + this._positionY + "_" + this._positionX).show();
				else this.$("#add-button-north_" + this._positionY + "_" + this._positionX).show();
			}
			else if ((this._location == "e") || (this._location == "w")) {
				if (this._location == "e") this.$("#add-button-west_" + this._positionY + "_" + this._positionX).show();
				else this.$("#add-button-east_" + this._positionY + "_" + this._positionX).show();
			}
			else if (this._location == "body") {
				var availablePositions = this._workspace.getAvailablePositions(this._positionX, this._positionY);

				if (availablePositions.length != 4) {
					if (availablePositions.indexOf("n") === -1) this.$("#add-button-north_" + this._positionY + "_" + this._positionX).show();
					if (availablePositions.indexOf("s") === -1) this.$("#add-button-south_" + this._positionY + "_" + this._positionX).show();
					if (availablePositions.indexOf("e") === -1) this.$("#add-button-east_" + this._positionY + "_" + this._positionX).show();
					if (availablePositions.indexOf("w") === -1) this.$("#add-button-west_" + this._positionY + "_" + this._positionX).show();
				}
			}
		},

		// {{ Event Binding }}

		unbind: function() {
			this.$(".add-button").unbind("dblclick");
		},

		bind: function() {
			var that = this;

			this.$(".add-button").dblclick(function(e) {
				e.stopPropagation();
				e.preventDefault();

				that._workspace.addBoard(that._positionX, that._positionY);
			});
		},

		// {{ Getters }}

		getPositionX: function() {
			return this._positionX;
		},

		getPositionY: function() {
			return this._positionY;
		},

		getType: function() {
			return "addBoard";
		},

		getWidth: function() {
			return this._width;
		},

		getHeight: function() {
			return this._height;
		},

		// {{ Setters }}

		setPosition: function(positionX, positionY) {
			this._positionX = positionX;
			this._positionY = positionY;
		},

		// {{ Public Methods }}

		destroy: function() {
			$(this.el).detach();
			this.remove();
		}
	});

	AddBoard.Dialog = Backbone.View.extend({
		el: "<div>",

    	// {{ Contructor }}
	
		initialize: function(options) {
			this._position = options.position;
		}
	});	

	return AddBoard;
});