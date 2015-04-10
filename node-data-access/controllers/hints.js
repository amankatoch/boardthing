var Hint = require(config.hintModel);

// ===== Actions for getting all the board hints, these are what are displayed while a board is loading
exports.getWorkspaceHint = function (callback) {
	Hint.find(function(err, hints) {
		if (err) {
			dataError.log({
				model: __filename,
				action: "getAllHints",
				code: 500,
				msg: "Error retrieving hints",
				err: err
			});
		}
		else if ((hints) && (hints.length)) {
			var messageNo = -1;

			// priority 1 messages are always displayed, there should only ever be 1 priority 1 hint
			for (var i = 0; i < hints.length; i++) {
				if (hints[i].priority == 1) {
					messageNo = i;
					break;
				}
			};

			// If there are not priority 1 message the randomly pick the message to return
			if (messageNo === -1) messageNo = Math.floor(Math.random() * ((hints.length-1) - 0 + 1)) + 0;

			callback(hints[messageNo].content);
		}
		else {
			callback(null);
		}
	});
}