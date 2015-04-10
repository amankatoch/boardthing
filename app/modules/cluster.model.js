define([],

function() {
	var ClusterModel = {};

	ClusterModel.Generate = function(model, parentId) {
		var parentIsVoting = false, 
			isVoting = false, 
			votesReceived = 0;

		if  (model.parentIsVoting) parentIsVoting = model.parentIsVoting;
		if  (model.isVoting) isVoting = model.isVoting;
		if  (model.votesReceived) votesReceived = model.votesReceived;

		var clusterModel = {
			id: model.id, 
			boardId: model.boardId,
			type: model.type, 
			parentId: parentId,
			parentIsVoting: parentIsVoting, 
			isVoting: isVoting, 
			votesReceived: votesReceived, 
			xPos: model.xPos,
			yPos: model.yPos,
			width: model.width,
			height: model.height,
			color: model.color, 
			title: model.title, 
			content: model.content, 
			created: model.created, 
			createdDate: new Date(model.created)
		};
		
		if (model.collapsed == null) {
			if (parentId == null) clusterModel.collapsed = false;
			else clusterModel.collapsed = true;
		}
		else clusterModel.collapsed = model.collapsed;

		if (model.votesReceived > 0) {
			if (model.type.trim().toLowerCase() == "text") clusterModel.content = model.content + " (+" + model.votesReceived + ")";
			else clusterModel.title = model.title + " (+" + model.votesReceived + ")";

			clusterModel.votesReceived = 0;
		}

		if (model.cards) clusterModel.cards = model.cards;
		else clusterModel.cards = [];

		return clusterModel;
	};

	return ClusterModel;
});