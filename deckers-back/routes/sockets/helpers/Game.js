const UserModel = require("../../../models/user");
const CardModel = require("../../../models/card");

const Card = require("./Card");
const Player = require("./Player");
const Effect = require("./Effect");

class Game {
    constructor(databaseGame) {
        this.gameId = databaseGame._id;
        this.playersIdArray = databaseGame.players.map(player => player.user);

        this.players = [];
        this.currentPlayer = 1;
        this.currentRound = 1;

        this.players = databaseGame.players.map(player => new Player(player.deck));

        CardModel.find({}).then(res => this.cardList = res)
    }

    handleAttackEvent(playerMinionId, enemyMinionId) {
        if (enemyMinionId === null) this.handleAttackOnHero(playerMinionId)
        else this.handleAttackOnMinion(playerMinionId, enemyMinionId);

        const result = this.players.map(player => ({ cardsOnBoard: player.cardsOnBoard, health: player.health }))
        return result
    }

    handleEndTurnEvent() {
        this.currentPlayer = (this.currentPlayer + 1) % Game.PLAYER_AMOUNT;
        this.currentRound++;

        this.players[this.currentPlayer].handleEndTurn(this.currentRound)
    }

    handleCardDrawEvent() {
        return this.players[this.currentPlayer].drawCard()
    }

    handleCardSummonEvent(boardPosition, handPosition, target) {
        const card = this.players[this.currentPlayer].summonCard(boardPosition, handPosition)
        if (card.effects && card.effects.onSummon.length > 0) this.invokeCardEffect(card.effects.onSummon[0], target || null)

        const result = this.players.map(player => ({ cardsOnBoard: player.cardsOnBoard, health: player.health }))
        return { card, result };
    }

    invokeCardEffect(effect, target, reversePlayers = false) {
        if (effect.effect === CardModel.Effect.EFFECT_LIST.DAMAGE || effect.effect === CardModel.Effect.EFFECT_LIST.HEAL)
            this.handleHealAndDamageEffect(effect, target)
        else if (effect.effect === CardModel.Effect.EFFECT_LIST.SUMMON)
            this.handleSummonEffect(effect, reversePlayers)
        else if (effect.effect === CardModel.Effect.EFFECT_LIST.KILL_ON_CONDITION)
            this.handleKillOnCondition(effect, target)
    }

    handleKillOnCondition(effect, target) {
        if (Object.values(CardModel.Effect.TARGET_LIST.AOE).includes(effect.target)) this.applyEffectAoe(effect)
        else if (target !== null) this.applyEffectToTarget(target, effect)
    }

    handleSummonEffect(effect, reversePlayers) {
        const { Effect } = CardModel;
        const { TARGET_LIST } = Effect

        const includeEnemyBoard = [TARGET_LIST.GENERAL.ALL, TARGET_LIST.GENERAL.ENEMY]
        const includeAllyBoard = [TARGET_LIST.GENERAL.ALL, TARGET_LIST.GENERAL.ALLY]

        const card = this.cardList.find(dbCard => dbCard._id.equals(effect.value)).toObject();

        const gameCard = {
            ...card,
            inGame: {
                isReady: false,
                stats: card.stats[Game.SUMMONED_CARD_LEVEL]
            }
        }

        console.log(gameCard)
        const currentPlayer = reversePlayers ? +!this.currentPlayer : this.currentPlayer

        // Makes sure you dont have too many cards on board
        const isEnemyBoardFull = this.players[currentPlayer].cardsOnBoard.length >= Game.MAX_CARDS_ON_BOARD
        const isAllyBoardFull = this.players[currentPlayer].cardsOnBoard.length.length >= Game.MAX_CARDS_ON_BOARD

        if (includeEnemyBoard.includes(effect.target) && !isEnemyBoardFull) this.players[currentPlayer].cardsOnBoard.push(gameCard)
        if (includeAllyBoard.includes(effect.target) && !isAllyBoardFull) this.players[currentPlayer].cardsOnBoard.push(gameCard)
    }

    handleHealAndDamageEffect(effect, target) {
        if (effect.effect === CardModel.Effect.EFFECT_LIST.DAMAGE) effect.value = -Math.abs(effect.value);

        if (Object.values(CardModel.Effect.TARGET_LIST.AOE).includes(effect.target)) this.applyEffectAoe(effect)
        else if (target !== null) this.applyEffectToTarget(target, effect)
    }

    applyEffectToTarget(target, effect) {
        const affectedPlayer = target.includes("enemy") ? +!this.currentPlayer : this.currentPlayer

        if (target.includes("portrait")) {
            this.players[affectedPlayer].health += effect.value

            // Handles overheal
            if (this.players[affectedPlayer].health > Player.MAX_HERO_HEALTH)
                this.players[affectedPlayer].health = Player.MAX_HERO_HEALTH
        }
        else if (target.includes("minion")) {
            const minionIndex = +target.slice(-1);
            if (effect.effect === CardModel.Effect.EFFECT_LIST.KILL_ON_CONDITION) {
                const isConditionMeet = Effect.checkCondition(this.players[affectedPlayer].cardsOnBoard[minionIndex], effect.value)

                // Place a null value in minion array if he died
                if (isConditionMeet) {
                    if (this.players[affectedPlayer].cardsOnBoard[minionIndex].effects && this.players[affectedPlayer].cardsOnBoard[minionIndex].effects.finalWords.length > 0) {
                        const reversePlayers = target.includes("enemy")
                        this.invokeCardEffect(this.players[affectedPlayer].cardsOnBoard[minionIndex].effects.finalWords[0], null, reversePlayers)
                    }
                    this.players[affectedPlayer].cardsOnBoard[minionIndex] = null
                }
            }
            else {
                const newHealth = this.players[affectedPlayer].cardsOnBoard[minionIndex].inGame.stats.health + effect.value

                // Handles overheal
                const level = this.players[affectedPlayer].cardsOnBoard[minionIndex].level;

                if (newHealth > this.players[affectedPlayer].cardsOnBoard[minionIndex].stats[level].health)
                    this.players[affectedPlayer].cardsOnBoard[minionIndex].inGame.stats.health = this.players[affectedPlayer].cardsOnBoard[minionIndex].stats[level].health
                else this.players[affectedPlayer].cardsOnBoard[minionIndex].inGame.stats.health = newHealth;

                // Place a null value in minion array if he died
                if (this.players[affectedPlayer].cardsOnBoard[minionIndex].inGame.stats.health <= 0) {
                    if (this.players[affectedPlayer].cardsOnBoard[minionIndex].effects && this.players[affectedPlayer].cardsOnBoard[minionIndex].effects.finalWords.length > 0) {
                        const reversePlayers = target.includes("enemy")
                        this.invokeCardEffect(this.players[affectedPlayer].cardsOnBoard[minionIndex].effects.finalWords[0], null, reversePlayers)
                    }

                    this.players[affectedPlayer].cardsOnBoard[minionIndex] = null
                }
            }
            // Filters out dead minions 
            this.players[affectedPlayer].cardsOnBoard = this.players[affectedPlayer].cardsOnBoard.filter(card => card !== null)
        }
    }

    applyEffectAoe(effect) {
        const { Effect } = CardModel;
        const { TARGET_LIST } = Effect

        const includeEnemyBoard = [TARGET_LIST.AOE.ALL, TARGET_LIST.AOE.ENEMY, TARGET_LIST.AOE.ALL_MINIONS, TARGET_LIST.AOE.ENEMY_MINIONS]
        const includeAllyBoard = [TARGET_LIST.AOE.ALL, TARGET_LIST.AOE.ALLY, TARGET_LIST.AOE.ALL_MINIONS, TARGET_LIST.AOE.ALLY_MINIONS]

        const includeEnemyHero = [TARGET_LIST.AOE.ALL, TARGET_LIST.AOE.ENEMY, TARGET_LIST.SINGLE_TARGET.ENEMY_HERO]
        const includeAllyHero = [TARGET_LIST.AOE.ALL, TARGET_LIST.AOE.ALLY, TARGET_LIST.SINGLE_TARGET.ALLY_HERO]

        // Determines whose board should be affected
        let affectedPlayers = [];
        if (includeEnemyBoard.includes(effect.target)) affectedPlayers.push(+!this.currentPlayer)
        if (includeAllyBoard.includes(effect.target)) affectedPlayers.push(this.currentPlayer)

        affectedPlayers.map(player => {
            for (let i = 0; i < this.players[player].cardsOnBoard.length; i++) {
                this.players[player].cardsOnBoard[i].inGame.stats.health += effect.value

                // Handles overheal
                const level = this.players[player].cardsOnBoard[i].level;

                if (this.players[player].cardsOnBoard[i].inGame.stats.health > this.players[player].cardsOnBoard[i].stats[level].health)
                    this.players[player].cardsOnBoard[i].inGame.stats.health = this.players[player].cardsOnBoard[i].stats[level].health

                // Place a null value in minion array if he died
                if (this.players[player].cardsOnBoard[i].inGame.stats.health <= 0) this.players[player].cardsOnBoard[i] = null
            }
            // Filters out dead minions
            this.players[player].cardsOnBoard = this.players[player].cardsOnBoard.filter(card => card !== null)
        })

        // Determines whose hero should be affected
        affectedPlayers = [];
        if (includeEnemyHero.includes(effect.target)) affectedPlayers.push(+!this.currentPlayer)
        if (includeAllyHero.includes(effect.target)) affectedPlayers.push(this.currentPlayer)

        affectedPlayers.map(player => {
            this.players[player].health += effect.value

            // Handles overheal
            if (this.players[player].health > Player.MAX_HERO_HEALTH)
                this.players[player].health = Player.MAX_HERO_HEALTH
        })
    }

    handleAttackOnHero(playerMinionId) {
        let { players, currentPlayer } = this;
        let playerCardsOnBoard = players[currentPlayer].cardsOnBoard;
        let attackingMinion = playerCardsOnBoard[playerMinionId];

        if (!attackingMinion.inGame.isReady) throw (new Error("This minion is not ready"));
        attackingMinion.inGame.isReady = false;

        // Move this to Player function?
        let enemyHealth = players[+!currentPlayer].health;
        enemyHealth = enemyHealth - attackingMinion.inGame.stats.damage;

        players[+!currentPlayer].health = enemyHealth;
    }

    handleAttackOnMinion(playerMinionId, enemyMinionId) {
        let { currentPlayer, players } = this;

        let attackingMinion = players[currentPlayer].cardsOnBoard[playerMinionId];
        let attackedMinion = players[+!currentPlayer].cardsOnBoard[enemyMinionId];

        if (!attackingMinion.inGame.isReady) throw (new Error("This minion is not ready"));
        attackingMinion.inGame.isReady = false;

        attackedMinion.inGame.stats.health -= attackingMinion.inGame.stats.damage;
        attackingMinion.inGame.stats.health -= attackedMinion.inGame.stats.damage;

        if (attackedMinion.inGame.stats.health <= 0) {
            players[+!currentPlayer].cardsOnBoard.splice(enemyMinionId, 1)
            if (attackedMinion.effects && attackedMinion.effects.finalWords.length > 0)
                this.invokeCardEffect(attackedMinion.effects.finalWords[0], null, true)
        }
        else players[+!currentPlayer].cardsOnBoard[enemyMinionId] = attackedMinion;

        if (attackingMinion.inGame.stats.health <= 0) {
            players[currentPlayer].cardsOnBoard.splice(playerMinionId, 1);
            if (attackingMinion.effects && attackingMinion.effects.finalWords.length > 0)
                this.invokeCardEffect(attackingMinion.effects.finalWords[0])
        }
        else players[currentPlayer].cardsOnBoard[playerMinionId] = attackingMinion;
    }

    // Checks if frontend data equals backend data
    compareData(data) {
        const { currentRound, currentPlayer, cardsOnBoard, cardsOnHand, enemyCardsOnBoard, enemyCardsOnHand, enemyHeroHealth, playerHeroHealth, enemyHeroGold, playerHeroGold } = data

        if (currentRound !== this.currentRound) return false;
        if (currentPlayer !== this.currentPlayer) return false;

        if (playerHeroHealth !== this.players[this.currentPlayer].health) return false;
        if (enemyHeroHealth !== this.players[+!this.currentPlayer].health) return false;

        if (playerHeroGold !== this.players[this.currentPlayer].gold) return false;
        if (enemyHeroGold !== this.players[+!this.currentPlayer].gold) return false;

        const boardArr = this.players[this.currentPlayer].cardsOnBoard.map((card, i) => Card.compareCards(card, cardsOnBoard[i]))
        if (boardArr.includes(false)) return false;

        const handArr = cardsOnHand.map((card, i) => Card.compareCards(card, this.players[this.currentPlayer].cardsOnHand[card.position]))
        if (handArr.includes(false)) return false;

        const enemyBoardArr = this.players[+!this.currentPlayer].cardsOnBoard.map((card, i) => Card.compareCards(card, enemyCardsOnBoard[i]))
        if (enemyBoardArr.includes(false)) return false;

        if (enemyCardsOnHand.length !== this.players[+!this.currentPlayer].cardsOnHand.length) return false;

        return true;
    }

    checkForGameOver() {
        const deadPlayerIndex = this.players.findIndex(player => player.health <= 0)
        if (deadPlayerIndex !== -1) return true
        return false
    }

    async handleGameOver() {
        try {
            const deadPlayerIndex = this.players.findIndex(player => player.health <= 0)
            const winner = +!deadPlayerIndex

            const usersPromises = this.playersIdArray.map(id => UserModel.findById(id))
            const users = await Promise.all(usersPromises);

            // Rewards hard coded xD
            users[winner].currency.gold += Game.WIN_REWARD;
            users[winner].inGame = false;

            users[+!winner].currency.gold += Game.LOSE_REWARD;
            users[+!winner].inGame = false;

            await users.map(user => user.save())
            return users.map(usr => ({ gold: usr.currency.gold, id: usr._id })); // Returns only gold amount, no need for more now | id for user identyfication
        } catch (err) {
            console.log(err)
        }
    }

    getStarterCards({ selected, role }) {
        const cardsToSplice = selected === null ? 3 : 4;
        let replacedCard;

        const cards = this.players[role].deck.splice(0, cardsToSplice);
        if (selected !== null) [replacedCard] = cards.splice(selected, 1);

        if (replacedCard) this.players[role].deck.push(replacedCard);

        this.players[role].cardsOnHand = cards;
        return cards;
    }

    getReconnectData() {
        const playersDataArray = this.players.map(player => {
            const { cardsOnBoard, cardsOnHand, health, gold, deck, currentCard } = player
            return {
                cardsOnBoard,
                cardsOnHand,
                health,
                gold,
                cardsLeftInDeck: deck.length - currentCard,
            }
        })

        const data = {
            currentPlayer: this.currentPlayer,
            currentRound: this.currentRound,

            playersDataArray,
        }

        return data
    }
}

Game.PLAYER_AMOUNT = 2;
Game.CARD_DRAW_COST = 1; // SAME VARIABLE ON CLIENT SIDE, CAREFUL WITH MODIFICATIONS
Game.MAX_CARDS_ON_BOARD = 4; // SAME VARIABLE ON CLIENT SIDE, CAREFUL WITH MODIFICATIONS
Game.MAX_CARDS_ON_HAND = 6; // SAME VARIABLE ON CLIENT SIDE, CAREFUL WITH MODIFICATIONS
Game.SUMMONED_CARD_LEVEL = 0 // SAME VARIABLE ON CLIENT SIDE, CAREFUL WITH MODIFICATIONS

Game.WIN_REWARD = 17;
Game.LOSE_REWARD = 9;

module.exports = Game