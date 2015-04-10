var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
    id: ObjectId, // the id of the user
    sessionId: {type: String, default: ''}, // the session id that is assigned to the user
    username: {type: String, default: ''}, // the username of the user, generally firstname lastname
    email: {type: String, default: ''}, // the email of the user. this must be unique for each user
    password: {type: String, default: ''}, // the password of the user. This is sorted hashed
    joined: { type: Date, default: Date.now }, // the date the user joined BoardThing
    sharedWorkspaces: [{id: { type: ObjectId, ref: 'Board' } }], // the list of shared boards associated to this user
    note: {type: String, default: ''}, // the "how did you hear about us" field filled in when a user joins BoardThing
    displayCardAddHint: {type: Boolean, default: true }, // whether hints should be showed to this user when they first open a board
    acceptCommunication: {type: Boolean, default: false }, // whether this user selected to accept communication when signing up
});

module.exports = mongoose.model("User", UserSchema);