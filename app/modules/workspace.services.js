define([
	"jquery"
],

function() {
	var Workspace = {};

	Workspace.GetAll = function(callback) {
		$.ajax({
			type: "GET",
			url: "/workspaces",
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	Workspace.Get = function(id, callback) {
		$.ajax({
			type: "GET",
			url: "/workspaces/" + id,
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	Workspace.Insert = function(title, callback) {
		$.ajax({
			type: "POST",
			url: "/workspaces",
			data:  {
				title: title
			},
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	Workspace.UpdateBoardPositions = function(id, boardPositions, callback) {
		$.ajax({
			type: "PUT",
			url: "/workspaces/boardPositions/" + id,
			data: {
				boardPositions: boardPositions
			},
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	return Workspace;
});