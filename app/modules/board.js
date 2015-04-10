define([
	"modules/css.helpers",
	"jquery"
],

function(CSSHelpers) {
	var Board = {};
	
  	Board.Index = Backbone.View.extend({
		el: "<div>",

    	// {{ Contructor }}
	
		initialize: function(options) {
			this.el.id = "board_" + this.model.id;
			this.el.className = "board outlined";

			this._workspace = options.workspace;

			this._mode = options.mode;
		},

		// {{ Object Building }}

		render: function() {
			var that = this;

			$.get("/app/templates/board/item.html", function(contents) {
				that.$el.html(_.template(contents, that.model));

				that.afterRender();

				that.unbind();
				that.bind();
			}, "text");
		},

		afterRender: function() {
			this.$el.width(this._workspace.getBoardWidth());
			this.$el.height(this._workspace.getBoardHeight());

			this.$("#board-cards_" + this.model.id).width(this._workspace.getBoardWidth());
			this.$("#board-cards_" + this.model.id).height(this._workspace.getBoardHeight());

			this.$("#page-canvas_" + this.model.id).width(this._workspace.getBoardWidth());
			this.$("#page-canvas_" + this.model.id).height(this._workspace.getBoardHeight());

			if (this._mode == "boardMap") this.$el.addClass("cell");

			this.$("#board-cards_" + this.model.id).empty();

			this._workspace.unbindBoard(this.model.id);
			this._workspace.bindBoard(this.model.id);		

			this._workspace.getBoardItems(this.model.id);

			if (this._mode == "individual") this.center();

			if (this._workspace.getBoardCount() === 1) $("#board-action-container_" + this.model.id).hide();
		},

		// {{ Event Binding }}

		unbind: function() {
			$("#board-action-container_" + this.model.id).unbind("click");
			$("#board-delete-button_" + this.model.id).unbind("click");
		},

		bind: function() {
			var that = this;

			$("#board-action-container_" + this.model.id).click(function(event) {
				event.stopPropagation();
				event.preventDefault();

				if (!$("#board-settings-menu_" + that.model.id).is(":visible")) {
					$("#board-settings-menu_" + that.model.id).show(); 
				}
				else {
					$("#board-settings-menu_" + that.model.id).hide();
				}
			});

			$("#board-delete-button_" + this.model.id).click(function(event) {
				event.stopPropagation();
				event.preventDefault();

				that.$("#board-settings-menu_" + that.model.id).hide();
				that._workspace.deleteBoard(that.model.id);
			});
		},

		// {{ Getters }}

		getId: function() {
			return this.model.id;
		},

		getType: function() {
			return "board";
		},

		getXPos: function() {
			return this.$el.position().left;
		},

		getYPos: function() {
			return this.$el.position().top;
		},

		getRelativeXPos: function() {
			return this.$el.position().left+this._workspace.getBoardScrollWidth();
		},

		getRelativeYPos: function() {
			return this.$el.position().top+this._workspace.getBoardScrollHeight();
		},

		getPositionX: function() {
			return this.model.positionX;
		},

		getPositionY: function() {
			return this.model.positionY;
		},

		// {{ Setters }}

		setZoom: function(zoom) {
			CSSHelpers.setZoom(this.$el, zoom);
		},

		setPosition: function(position) {
			this._position = position;
		},

		// {{ Public Methods }}

		center: function() {
			CSSHelpers.center(this.$el, this._workspace.getZoom());
		},

		destroy: function() {
			$(this.el).detach();
			this.remove();
		}
  	});

	Board.List = Backbone.View.extend({
		el: "<div>",
	
		initialize: function(options) {
			this.el.id = "board-map-board_" + this.model.id;
			this.el.className = "board-map-board-container";

			this._parent = options.parent;

			this._workspace = options.workspace;
		
			this.render()
		},

		render: function() {
			var that = this;

			$.get("/app/templates/boardMap/board.html", function(contents) {
				that.$el.html(_.template(contents, that.model));

				that.unbind();
				that.bind();
			}, "text");
		},

		unbind: function() {
			this.$(".board-map-board").unbind("dblclick");
		},

		bind: function() {
			var that = this;

			this.$(".board-map-board").dblclick(function(e) {
				that._workspace.setSelectedBoard($(this).attr("element-id"));
				that._workspace.hideBoardMap();
			});
		},

		getBoardId: function() {
			return this.model.id;
		},

		getBoardPosition: function() {
			return this.model.position;
		},

		setBoardPosition: function(position) {
			this.model.position = position;
		},

		destroy: function() {
			$(this.el).detach();
			this.remove();
		}
	});

	return Board;
});