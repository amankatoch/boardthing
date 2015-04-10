define([
],

function() {
	var BoardModel = {};

	BoardModel.Generate = function(model, workspaceId) {
		var boardModel = {
			id: model.id,
			workspaceId: workspaceId,
			title: model.title,
			width: model.width,
			height: model.height,
			created: model.created,
			lastModified: model.lastModified,
			position: model.position
		}

		if (model.cards) boardModel.cards = model.cards;
		else boardModel.cards = [];

		return boardModel;
	};

	return BoardModel;
});
