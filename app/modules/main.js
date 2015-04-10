define([
	"modules/workspace.add",
	"modules/workspace",
	"modules/workspace.services",
	"jquery"
],

function(AddWorkspace, Workspace, Workspace_Services) {
	var Main = {};

	// ===== View that appears to users when they first log in. Allows board management.

	Main.Index = Backbone.View.extend({
    	el: "<div>",
    	_workspaces: [],

    	// {{ Contructor }}

		initialize: function() {
			this.render();
      	},

		// {{ Object Building }}

		render: function(){
			var that = this;

			$.get("/app/templates/main/index.html", function(contents) {
				that.$el.html(_.template(contents));
			
				that.afterRender();

				that.unbind();
				that.bind();
			}, "text");
		},

		afterRender: function() {
			var that = this;

			Workspace_Services.GetAll(function(response) {
				if (response.code == 200) {
					var workspaces = response.workspaces;

					for (var i=0, workspacesLength=workspaces.length; i<workspacesLength; i+=1) {
						that._workspaces.push(new Workspace.List({ model: workspaces[i], parent: that }));
					}

					that.renderWorkspaces();
				}
			});
		},

		// {{ Event Binding }}

		unbind: function() {
  			this.$("#create-workspace-button").unbind("click");
		},

		bind: function() {
  			var that = this;

  			this.$("#create-workspace-button").click(function(e) {
  				that.createWorkspace();
  			});
		},

	    // {{ Public Methods }}

		//  ********** Actions for managing workspaces **********

		renderWorkspaces: function() {
			this.$("#workspace-list-body").empty();

			this._workspaces.sort(function (a, b) {
				return a.model.created < b.model.created ? 1 : a.model.created > b.model.created ? -1 : 0; 
			});

			for (var i=0, workspacesLength=this._workspaces.length; i<workspacesLength; i++) {
				this.$("#workspace-list-body").append(this._workspaces[i].el);
			}
		},

		viewWorkspace: function(workspaceId) {
  			window.location.href = "/workspace/" + workspaceId;
		},

		// ********** Actions to create a new workspace **********

		createWorkspace: function() {
			this._addWorkspace = new AddWorkspace.New({ parent: this });

			this.$("#modal-overlay").html(this._addWorkspace.el);
			this.$("#modal-overlay").show();
		},

		workspaceAdded: function(workspace) {
			this._addWorkspace.destroy();

			this.$("#modal-overlay").empty();
			this.$("#modal-overlay").hide();

			this._workspaces.push(new Workspace.List({ model: workspace, parent: this }));

			this.renderWorkspaces();

			this.viewWorkspace(workspace.id);
		},

		cancelAddWorkspace: function() {
			this._addWorkspace.destroy();

			this.$("#modal-overlay").empty();
			this.$("#modal-overlay").hide();
		}
	});

	return Main;
});