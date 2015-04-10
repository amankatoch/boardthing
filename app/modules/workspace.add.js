define([
	"modules/workspace.services",
	"jquery"
],

function( Workspace_Services) {
	var AddWorkspace = {};

	// ===== View to create a new workspace

	AddWorkspace.New = Backbone.View.extend({
    	el: "<div>",

    	// {{ Contructor }}

		initialize: function(options) {
			this.el.id = "add-workspace";
			this.el.className = "popup-container";

			this._parent = options.parent;

			$(this.el).click(function(e) {
				e.stopPropagation();
				e.preventDefault();
			});

			this.render();
      	},

		// {{ Object Building }}

		render: function() {
			var that = this;

			$.get("/app/templates/workspace/add.html", function(contents) {
				that.$el.html(_.template(contents));

				that.unbind();
				that.bind()
			}, "text");
		},

		// {{ Event Binding }}

		unbind: function() {
			this.$("#add-button").unbind("click");
			this.$("#cancel-button").unbind("click");
		},

		bind: function() {
			var that = this;

			this.$("#add-button").click(function(e) {
				that.create();
			});

			this.$("#cancel-button").click(function(e) {
				that.cancel();
			});
		},

		// {{ Public Methods }}

		create: function() {
			var that = this,
				title = this.$("#title").val();

			this.$("#create-error-message").empty();

			if ((title) && (title.trim().length > 0)) {
				Workspace_Services.Insert(title.trim(), function(response) {
					if (response.code == 200) that._parent.workspaceAdded(response.workspace);
					else that.$("#create-error-message").html(response.message);
				})
			}
			else {
				this.$("#create-error-message").html("Workspaces require a title");
			}
		},

		cancel: function() {
			this._parent.cancelAddWorkspace();
		},

		destroy: function() {
			$(this.el).detach();
			this.remove();
		}
	});

	return AddWorkspace;
});