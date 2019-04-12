var mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // new Auth
var deepPopulate = require('mongoose-deep-populate')(mongoose);


var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    // added for future uses (already implemented in auth) - Pszemek
    email: String,
    profileImageUrl: String,
    //

    currency: {
        gold: { type: Number, default: 0 },
        gems: { type: Number, default: 0 }
    },

    cards: [{
        card: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Card"
        },
        amount: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],

    decks: [{
        name: String,
        cards: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Card"
        }],
    }],

    inGame: { type: Boolean, default: false },

    currentGame: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game"
    }
});

// NEW AUTH - Pszemek
UserSchema.pre("save", async function (next) {
    try {
        if (!this.isModified("password")) {
            return next();
        }
        let hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        return next();
    } catch (err) {
        return next(err);
    }
});

UserSchema.methods.comparePassword = async function (candidatePassword, next) {
    try {
        let isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    } catch (err) {
        return next(err);
    }
};

// UserSchema.plugin(passportLocalMongoose); new Auth introduced - Pszemek
UserSchema.plugin(deepPopulate);

const User = mongoose.model("User", UserSchema);

module.exports = User;
