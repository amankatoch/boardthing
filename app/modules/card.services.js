define([
	"jquery"
],

function() {
	var Card = {};

	Card.InsertTextCard = function(workspaceId, boardId, card, callback) {
		$.ajax({
			type: "POST",
			url: "/workspace/boards/cards/text/" + workspaceId + "/" + boardId,
			data: card,
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};
	
	Card.UpdateTextCard = function(workspaceId, boardId, cardId, card, callback) {
        $.ajax({
            url: "/workspace/boards/cards/text/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "PUT",
            dataType: "json",
            data: card,
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.UpdateImageCard = function(workspaceId, boardId, cardId, card, callback) {
        $.ajax({
            url: "/workspace/boards/cards/image/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "PUT",
            dataType: "json",
            data: card,
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.Delete = function(workspaceId, boardId, cardId, callback) {
        $.ajax({
            url: "/workspace/boards/cards/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "DELETE",
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.UpdatePosition = function(workspaceId, boardId, cardId, xPos, yPos, callback) {
        $.ajax({
            url: "/workspace/boards/cards/position/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "PUT",
            dataType: "json",
			data: {
	        	xPos: xPos,
	        	yPos: yPos
	        },
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.SetBoard = function(workspaceId, boardId, cardId, xPos, yPos, callback) {
        $.ajax({
            url: "/workspace/boards/cards/board/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "PUT",
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.Resize = function(workspaceId, boardId, cardId, card, callback) {
        $.ajax({
            url: "/workspace/boards/cards/resize/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "PUT",
            dataType: "json",
            data: card,
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.Duplicate = function(workspaceId, boardId, cardId, callback) {
        $.ajax({
            url: "/workspace/boards/cards/duplicate/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "POST",
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.Lock = function(workspaceId, boardId, cardId, callback) {
        $.ajax({
            url: "/workspace/boards/cards/lock/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "PUT",
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.Unlock = function(workspaceId, boardId, cardId, callback) {
        $.ajax({
            url: "/workspace/boards/cards/unlock/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "PUT",
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Card.DownloadImage = function(workspaceId, boardId, card, callback) {
        $.ajax({
            url: "/workspace/boards/cards/downloadImage/" + workspaceId + "/" + boardId,
            type: 'POST',
            dataType: "json",
            data: card,
            success:  function(response) {
				if (callback) callback(response);
			}
    	});
	};

	return Card;
});