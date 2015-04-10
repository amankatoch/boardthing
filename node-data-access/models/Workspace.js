var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var WorkspaceSchema = new Schema({
	id: ObjectId, // id of the board
	owner: { type: ObjectId, ref: 'User' }, // id referencing User who is the owner of the workspace
	title: { type: String, default: '', trim: true }, // the title of a workspace
	boards: [{ type: ObjectId, ref: 'Board' }], // the boards associated to this workspace
	chat: [{
	    ownerName: { type: String, default: '' }, // the name of the user who wrote the chat item
	    content: { type: String, default: '' }, //  the content of the chat item
		created: { type: Date, default: Date.now } // the date the chat item was created
	}], // any chat associated to the workspace
	isPrivate: {type: Boolean, default: false }, // whether or not this is a private workspace (slightly redundant as only private workspaces have a password)
    password: { type: String, default: '' }, // the password for a private workspace
	created: { type: Date, default: Date.now }, // the datetime the workspace was created
	boardWidth: {type: Number, default: 1366 }, // the width of the board
	boardHeight: {type: Number, default: 695 } // the height of the board
});

module.exports = mongoose.model("Workspace", WorkspaceSchema);