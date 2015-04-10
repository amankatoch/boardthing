define([
	"jquery"
],

function() {
	var Board = {};

	Board.GetCards = function(id, callback) {
		$.ajax({
			type: "GET",
			url: "/workspace/boards/cards/" + id,
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	Board.UpdatePosition = function(workspaceId, boardId, positionX, positionY, callback) {
        $.ajax({
            url: "/workspace/boards/position/" + workspaceId + "/" + boardId,
            type: 'PUT',
            dataType: "json",
            data: { 
            	positionX: positionX, 
            	positionY: positionY
            },
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	}

	Board.UpdateCardZIndexes = function(workspaceId, boardId, sortedCards, callback) {
        $.ajax({
            url: "/workspace/boards/cards/zindex/" + workspaceId + "/" + boardId,
            type: 'PUT',
            dataType: "json",
            data: { 
            	cards: sortedCards 
            },
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	}
	
	Board.Insert = function(id, title, positionX, positionY, callback) {
		$.ajax({
			type: "POST",
			url: "/workspace/boards/" + id,
			data:  {
				title: title,
            	positionX: positionX, 
            	positionY: positionY
			},
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};
	
	Board.Delete = function(id, callback) {
		$.ajax({
			type: "DELETE",
			url: "/workspace/boards/" + id,
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	return Board;
});