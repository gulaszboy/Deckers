const User = require("../../models/user");
const Game = require("../../models/game");

const Matchmaking = {
    gameMode: [{
        playersInQueue: []
    }]
}

const t = setInterval(teamPlayers, 3000);
let gameSearch;

module.exports.connect = function (io) {
    gameSearch = io.of('/matchmaking');
    gameSearch.on('connection', function (socket) {

        socket.on('join', async function ({ usr_id, deck_id, gameMode = 0 }) {
            // needs player id, searched mode(as number)
            try {
                const user = await User.findById(usr_id);
                if (user.inGame) throw new Error("Player already in game");

                let player = {
                    usr_id,
                    deckId: deck_id,
                    socket,
                }

                // Checks if player isnt already in queue
                if (Matchmaking.gameMode[gameMode].playersInQueue.findIndex(pl => pl.usr_id === player.usr_id) !== -1)
                    throw new Error("Player already in queue");

                Matchmaking.gameMode[gameMode].playersInQueue.push(player);
                console.log("Player joined queue!");
            } catch (err) {
                console.log(err);
            }
        });

        socket.on('leave-queue', function ({ usr_id, gameMode = 0 }) {
            try {
                const playerIndex = Matchmaking.gameMode[gameMode].playersInQueue.findIndex(pl => pl.usr_id === usr_id)
                if (playerIndex === -1) throw new Error("Player wasnt in queue")
                Matchmaking.gameMode[gameMode].playersInQueue.splice(playerIndex, 1);
                console.log("Player left queue!");
            } catch (err) {
                console.log(err);
            }
        });

        socket.on('disconnect', function () {
            try {
                const playerIndex = Matchmaking.gameMode[0].playersInQueue.findIndex(pl => pl.socket === socket)
                console.log("Player in queue disconnected! " + playerIndex);
                Matchmaking.gameMode[0].playersInQueue.splice(playerIndex, 1);
            } catch (err) {
                console.log(err);
            }
        });
    });

    return io
}

async function teamPlayers() {
    try {
        Matchmaking.gameMode.forEach(function (gameMode, i) {
            for (let i = 0; i < Math.floor(gameMode.playersInQueue.length / 2); i++) pairPlayers(gameMode, i);
        })
    } catch (err) {
        console.log(err)
    }
}

async function pairPlayers(gameMode, i) {
    const playerArray = gameMode.playersInQueue.slice();
    try {
        let player1 = playerArray[2 * i];
        let player2 = playerArray[(2 * i) + 1];

        const user1Promise = User.findById(player1.usr_id);
        const user2Promise = User.findById(player2.usr_id)
        let [user1, user2] = await Promise.all([user1Promise, user2Promise]);
        playerArray.splice(2 * i, 2);

        // Saves edited players array to global object
        gameMode.playersInQueue = playerArray;

        // Crate game and add those players to it
        newGame = new Game({
            players: [],
        });

        const playerObjectArray = [player1, player2].map(p => ({ user: p.usr_id, deckId: p.deckId }))

        newGame.players.push(...playerObjectArray);
        await newGame.save();

        // Modify players inGame variable
        [user1, user2].forEach(function (user) {
            user.inGame = true;
            user.currentGame = newGame._id;
            user.save();
        })

        // Send info about game to players
        const roomName = (Date.now() + Math.random()).toString();
        [player1, player2].forEach(player => player.socket.join(roomName));

        console.log("Game ready!");
        gameSearch.in(roomName).emit('game-ready', { game_id: newGame._id });

        [player1, player2].forEach(player => player.socket.leave(roomName));

        console.log(gameMode.playersInQueue);
    } catch (err) {
        console.log(err)
    }
}
