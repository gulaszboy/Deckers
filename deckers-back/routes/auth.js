const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const symbiosisList = require("../symbiosis");

const User = require("../models/user");
const Chest = require("../models/chest");
const Option = require("../models/option");
const Card = require("../models/card");

router.post("/register", async function (req, res, next) {
    try {
        let [user, availableChests] = await Promise.all([await User.create(req.body), await fetchChests()])
        user.currency = { gold: 200 }
        user.cards = []
        user.save()

        let [a, b, c, d, e, f] = await fetchOptionList("maxCardLevel", "upgradeCardCost", "commonUpgradeGoldCost", "rareUpgradeGoldCost", "epicUpgradeGoldCost", "legendaryUpgradeGoldCost")

        let { id, username, profileImageUrl, email } = user;
        let token = jwt.sign(
            {
                id,
                username,
                profileImageUrl,
                email
            },
            process.env.SECRET_KEY
        );
        return res.status(200).json({
            user,
            options: {
                maxCardLevel: a,
                upgradeCardCost: b,
                commonUpgradeGoldCost: c,
                rareUpgradeGoldCost: d,
                epicUpgradeGoldCost: e,
                legendaryUpgradeGoldCost: f
            },
            symbiosisList,
            raceList: Card.raceList,
            roleList: Card.roleList,
            availableChests,
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
    // finding a user
    try {
        let [user, availableChests] = await Promise.all([fetchUser(req.body.email), fetchChests()])

        let { id, username, profileImageUrl, email } = user;
        let isMatch = await user.comparePassword(req.body.password);
        if (isMatch) {

            let [a, b, c, d, e, f] = await fetchOptionList("maxCardLevel", "upgradeCardCost", "commonUpgradeGoldCost", "rareUpgradeGoldCost", "epicUpgradeGoldCost", "legendaryUpgradeGoldCost")

            let token = jwt.sign(
                {
                    id,
                    username,
                    profileImageUrl,
                    email
                },
                process.env.SECRET_KEY
            );
            return res.status(200).json({
                user,
                options: {
                    maxCardLevel: a,
                    upgradeCardCost: b,
                    commonUpgradeGoldCost: c,
                    rareUpgradeGoldCost: d,
                    epicUpgradeGoldCost: e,
                    legendaryUpgradeGoldCost: f
                },
                symbiosisList,
                raceList: Card.raceList,
                roleList: Card.roleList,
                availableChests,
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

router.post("/:email/reloadUser", async function (req, res, next) {
    // finding a user
    try {
        let [user, availableChests] = await Promise.all([fetchUser(req.params.email), fetchChests()])

        let { id, username, profileImageUrl, email } = user;
        // let isMatch = await user.comparePassword(req.body.password);
        // if (isMatch) {

            let [a, b, c, d, e, f] = await fetchOptionList("maxCardLevel", "upgradeCardCost", "commonUpgradeGoldCost", "rareUpgradeGoldCost", "epicUpgradeGoldCost", "legendaryUpgradeGoldCost")

            let token = jwt.sign(
                {
                    id,
                    username,
                    profileImageUrl,
                    email
                },
                process.env.SECRET_KEY
            );
            return res.status(200).json({
                user,
                options: {
                    maxCardLevel: a,
                    upgradeCardCost: b,
                    commonUpgradeGoldCost: c,
                    rareUpgradeGoldCost: d,
                    epicUpgradeGoldCost: e,
                    legendaryUpgradeGoldCost: f
                },
                raceList: Card.raceList,
                roleList: Card.roleList,
                availableChests,
                token
            }
            );
        // } else {
            return next({
                status: 400,
                message: "Invalid Email/Password."
            });
        // }
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
    foundChests = await Chest.find({})

    let availableChests = foundChests.filter(chest => chest.isAvailable)
    return availableChests;
}

async function fetchOptionList() {
    let arr = Array.from(arguments);
    arr = await Promise.all(arr.map(value => Option.findOne({ short: value })))
    return arr;
}