define([],

function() {
	var CardModel = {};

	CardModel.Generate = function(model, parentId) {
		var parentIsVoting = false, 
			isVoting = false, 
			votesReceived = 0;

		if  (model.parentIsVoting) parentIsVoting = model.parentIsVoting;
		if  (model.isVoting) isVoting = model.isVoting;
		if  (model.votesReceived) votesReceived = model.votesReceived;

		var cardModel = {
			id: model.id, 
			boardId: model.boardId,
			type: model.type,
			title: model.title, 
			content: model.content,
			cards: [], 
			parentIsVoting: parentIsVoting, 
			isVoting: false, 
			votesReceived: votesReceived, 
			isLocked: model.isLocked, 
			xPos: model.xPos, 
			yPos: model.yPos, 
			created: model.created, 
			createdDate: new Date(model.created),
			width: model.width,
			height: model.height,
			color: model.color
		};

		if (model.votesReceived > 0) {
			if (model.type.trim().toLowerCase() == "text") cardModel.content = model.content + " (+" + model.votesReceived + ")";
			else cardModel.title = model.title + " (+" + model.votesReceived + ")";

			cardModel.votesReceived = 0;
		}

		if (parentId) cardModel.parentId = parentId;
		else cardModel.parentId = null;

		return cardModel;
	};
	
	return CardModel;
});