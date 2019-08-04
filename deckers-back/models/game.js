var mongoose = require("mongoose");
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var gameSchema = new mongoose.Schema({
    players: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        deck: [],
        deckId: String
    }],

    isFinished: { type: Boolean, default: false }
});

gameSchema.plugin(deepPopulate);

module.exports = mongoose.model("Game", gameSchema);
