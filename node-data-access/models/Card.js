var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var CardSchema = new Schema({
    id: ObjectId, // the id of the card
	board: { type: ObjectId, ref: 'Board' }, // the board that this card is attached to
    parentId: { type: String }, // the id of the card that is the parent to this one
	title: { type: String, default: '' }, // used for image cards, it's the text description for it
    content: { type: String, default: '' }, // in text cards this is the card content. In image cards this is the file name in the Amazong bucket
    type: { type: String, default: 'text' }, // the type of card this is, currently supported is text and image 
    created: { type: Date, default: Date.now }, // the datetime the card was created
	collapsed: {type: Boolean, default: false }, // used for cluster. Whether it should be rendere expanded or not
    children: [{ type: String }], // used for clusters. the children that are associated to the cluster
    isVoting: {type: Boolean, default: false }, // used for clusters. if the cluster currently has dot voting activated
    votesReceived: { type: Number, default: 0 }, // used if the card is in a cluster that is dot voting. the number of votes it has received
    isLocked: {type: Boolean, default: false }, // used if not cluster. Whether the card is locked in position
    width: { type: Number }, // used if not cluster. the width of a card
    height: { type: Number }, // used if not cluster. the height of a card
    xPos: { type: Number }, // the x position on a board
    yPos: { type: Number }, // the y position on a board
    zPos: { type: Number }, // in clusters, this is the position the card appears on a list. out of clusters this is the z-index on the board
    color: { type: String, default: '#FFFFFF' } // the color of the card
});

module.exports = mongoose.model("Card", CardSchema);