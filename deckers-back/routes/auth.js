const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Chest = require("../models/chest");
const Card = require("../models/card");

const currencyPacks = require("../api/currencyPacks")

const localConfig = {
    tagList: User.tagList,
}

router.post("/register", async function (req, res, next) {
    try {
        let [user, availableChests] = await Promise.all([await createNewUser(req.body), await fetchChests()])

        let { id, username, email } = user;
        let token = jwt.sign(
            {
                id,
                username,
                email
            },
            process.env.SECRET_KEY
        );

        user = prepareUserData(user)
        return res.status(200).json({
            user,
            availableChests,
            currencyPacks,
            config: localConfig,
            token
        });
    } catch (err) {
        if (err.code === 11000) {
            err.message = "Sorry, that username and/or email is taken";
        }
        return next({
            status: 666,
            message: err.message
        });
    }
});

router.post("/login", async function (req, res, next) {
    try {
        const cardsPromise = Card.find({ isFree: true })
        let [user, availableChests, freeCards] = await Promise.all([fetchUser(req.body.email), fetchChests(), cardsPromise])

        const cardsToConcat = freeCards.filter(card => !user.cards.some(c => c.card._id.equals(card._id)))
        user.cards = user.cards.concat(cardsToConcat.map(card => ({ level: 1, amount: 0, card })));

        let { id, username, email } = user;
        let isMatch = await user.comparePassword(req.body.password);
        if (isMatch) {

            let token = jwt.sign(
                {
                    id,
                    username,
                    email
                },
                process.env.SECRET_KEY
            );
            console.log(`${username} has loged in`)

            user = prepareUserData(user)
            return res.status(200).json({
                user,
                availableChests,
                currencyPacks,
                config: localConfig,
                token
            });
        } else {
            return next({
                status: 400,
                message: "Invalid Email/Password."
            });
        }
    } catch (e) {
        console.log(e)
        return next({ status: 400, message: "Invalid Email/Password." });
    }
});

module.exports = router;

async function fetchUser(email) {
    let foundUser = await User.findOne({ email: email }).deepPopulate('cards.card decks.cards.card')
    return foundUser;
}

async function fetchChests() {
    const foundChests = await Chest.find({})
    const availableChests = foundChests.filter(chest => chest.isAvailable);

    return availableChests
}

function prepareUserData(user) {
    const data = { ...user.toObject() }
    delete data.password;
    delete data.__v;

    return data
}

async function createNewUser(data) {
    const card = await Card.findOne()

    const dummyDeck = { name: "aaa", cards: [] }
    for (let index = 0; index < 10; index++) {
        dummyDeck.cards.push(card)
    }

    const dummyDecks = [{ ...dummyDeck }, { ...dummyDeck }, { ...dummyDeck }]
    dummyDecks[0].name = "I"
    dummyDecks[1].name = "II"
    dummyDecks[2].name = "III"

    data.decks = dummyDecks
    return User.create(data)
}