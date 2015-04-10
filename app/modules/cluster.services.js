define([
	"jquery"
],

function() {
	var Cluster = {};

	Cluster.Insert = function(workspaceId, boardId, clusterId, cluster, callback) {
		$.ajax({
			type: "PUT",
			url: "/workspace/boards/clusters/" + workspaceId + "/" + boardId + "/" + clusterId,
			data: cluster,
			success: function(response) {
				if (callback) callback(response);
			}
		});
	};

	Cluster.AttachCard = function(workspaceId, boardId, clusterId, cardId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/cards/" + workspaceId + "/" + boardId + "/" + clusterId + "/" + cardId,
            type: 'POST',
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.DetachCard = function(workspaceId, boardId, clusterId, cardId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/cards/" + workspaceId + "/" + boardId + "/" + clusterId + "/" + cardId,
            type: 'DELETE',
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.AttachCluster = function(workspaceId, boardId, targetClusterId, sourceClusterId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/clusters/" + workspaceId + "/" + boardId + "/" + targetClusterId + "/" + sourceClusterId,
            type: 'POST',
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.DetachCluster = function(workspaceId, boardId, targetClusterId, sourceClusterId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/clusters/" + workspaceId + "/" + boardId + "/" + targetClusterId + "/" + sourceClusterId,
            type: 'DELETE',
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.UpdatePosition = function(workspaceId, boardId, clusterId, xPos, yPos, callback) {
        $.ajax({
            url: "/workspace/boards/cards/position/" + workspaceId + "/" + boardId + "/" + clusterId,
            type: 'PUT',
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

	Cluster.Expand = function(workspaceId, boardId, clusterId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/expand/" + workspaceId + "/" + boardId + "/" + clusterId,
            type: 'PUT',
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.Collapse = function(workspaceId, boardId, clusterId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/collapse/" + workspaceId + "/" + boardId + "/" + clusterId,
            type: 'PUT',
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.StartDotVoting = function(workspaceId, boardId, clusterId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/startVoting/" + workspaceId + "/" + boardId + "/" + clusterId,
            type: 'PUT',
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.StopDotVoting = function(workspaceId, boardId, clusterId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/stopVoting/" + workspaceId + "/" + boardId + "/" + clusterId,
            type: 'PUT',
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.AddVote = function(workspaceId, boardId, cardId, callback) {
        $.ajax({
            url: "/workspace/boards/clusters/addVote/" + workspaceId + "/" + boardId + "/" + cardId,
            type: "POST",
            dataType: "json",
			success: function(response) {
				if (callback) callback(response);
			}
    	});
	};

	Cluster.Sort = function(workspaceId, boardId, clusterId, cards, callback) {
		$.ajax({
		    url: "/workspace/boards/clusters/sort/" + workspaceId + "/" + boardId + "/" + clusterId,
		    type: 'PUT',
		    dataType: "json",
		    data: {
		    	cards: cards
		    },
			success: function(response) {
				if (callback) callback(response);
			}
		});
	}

	return Cluster;
});