/*jslint es5: true, evil: true, plusplus: true, sloppy: true, vars: true, undef: true*/
/*global module, require, sys, casinobot, Config*/

(function () {
    var cards = require('cards.js');
    
    cards.generators.cardHolder = function () {};
    cards.Deck.createType('cardHolder', 'cardHolder');
    
    cards.useArc4 = true; // change this if it lags too much
    cards.raiseLimit = 50; // limit for raising
    cards.bigBlind = 5; // price of the big blind
    cards.smallBlind = 3; // price of the small blind
}());

// implementing Texas Hold'em
module.exports = function (casino) {
    var cards = require('cards.js'),
        randUtils = require('rand-utils.js');
    
    var game,
        module_scope = this;
    
    var commands = {
        user: {
            joinp: function (src, data) {
                if (!casino.coins.hasOwnProperty(sys.name(src).toLowerCase())) {
                    casino.coins[sys.name(src).toLowerCase()] = 100;
                }
                if (casino.coins[sys.name(src).toLowerCase()] < 80) {
                    return send(src, "You need at least 80 coins to join a game of poker.");
                }
                if (game.state !== 'signup') {
                    return send(src, "You can't sign up right now. Try later.");
                }
                if (game.signups.indexOf(sys.name(src)) !== -1) {
                    return send(src, "You've already signed up.");
                }
                // exceptions can be made to this.
                if (game.ips.indexOf(sys.ip(src)) !== -1) {
                    return send(src, "Your IP has already signed up.");
                }
                
                game.signups.push(sys.name(src));
                game.ips.push(sys.ip(src));
                
                if (game.signups.length === 22) {
                    game.ticks = 0;
                }
                
                broadcast(sys.name(src) + " joined! " + game.ticks + " second(s) left!");
                
                if (game.ticks === 0) {
                    ++game.ticks;
                }
            },
            leave: function (src, data) {
                var name = sys.name(src),
                    msg = name + " left.",
                    i;
                
                if (game.state === 'none') {
                    return send(src, "No game has started.");
                }
                if (game.signups.indexOf(name) !== -1) {
                    return send(src, "You've never signed up.");
                }
                
                game.signups.splice(game.signups.indexOf(name), 1);
                game.ips.splice(game.ips.indexOf(sys.ip(src)), 1);
                                
                if (game.state === 'signup') {
                    msg += " " + game.ticks + " second(s) left.";
                } else {
                    if (name === (playerGet(game.currentPlayer) || {}).name) {
                        nextPlayer();
                    }
                }
                
                for (i in game.players) {
                    if (game.players.hasOwnProperty(i)) {
                        if (game.players[i].name === name) {
                            delete game.players[i];
                            break;
                        }
                    }
                }
                
                broadcast(msg);
            },
            cards: function (src, data) {
                var self;
                if (game.state !== 'started') {
                    return send(src, "The game hasn't even started yet.");
                }
                if ((self = game.players[sys.name(src).toLowerCase()]) === undefined) {
                    return send(src, "You never joined the game!");
                }
                
                send(src, "Your cards:");
                send(src, self.deck[0].unicodeString() + " | " + self.deck[1].unicodeString());
            }
        },
        mod: {
            start: function (src, data) {
                game.state = 'signup';
                game.nextState = gameStart;
                game.ticks = 90;
                
                broadcast(sys.name(src) + " started a game of Texas Hold'em Poker! Type /joinp to join (you have " + game.ticks + " seconds to join)!");
            },
            stop: function (src, data) {
                resetGame();
                broadcast(sys.name(src) + " stopped the game!");
            }
        }
    };
    
    function handleCommand(src, message, channel) {
        var command,
            commandData,
            pos = message.indexOf(' ');
        
        if (pos !== -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos + 1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        
        if (commands.user.hasOwnProperty(command)) {
            commands.user[command].call(module_scope, src, commandData);
            return true;
        }
        
        if (sys.auth(src) <= 0 || Config.casinoAdmins.indexOf(sys.name(src).toLowerCase()) === -1) {
            throw "invalid command";
        }
        
        if (commands.mod.hasOwnProperty(command)) {
            commands.mod[command].call(module_scope, src, commandData);
            return true;
        }
    }
    
    function broadcast(msg) {
        if (msg === "") {
            return sendChanAll("", casino.chan);
        }
        casinobot.sendAll(msg, casino.chan);
    }
    
    function send(src, msg) {
        casinobot.sendMessage(src, msg, casino.chan);
    }
    
    function playerSet(pos, property, value) {
        game.players[Object.keys(game.players)[pos]][property] = value;
    }
    
    function playerGet(pos) {
        return game.players[Object.keys(game.players)[pos]];
    }
    
    function resetGame() {
        game = {
            players: {},
            signups: [],
            ips: [],
            deck: new cards.PokerDeck(),
            communityCards: new cards.cardHolder(),
            nextState: function () {},
            ticks: 0,
            round: 1,
            pot: sys.rand(10, 26),
            bet: cards.bigBlind,
            currentPlayer: 0,
            state: 'none'
        };
    }
    
    function newRound() {
        var i,
            player;
        
        game.deck = new cards.PokerDeck();
        game.communityCards = new cards.cardHolder();
        game.bet = cards.bigBlind;
        game.currentPlayer = 0;
        ++game.round;
        
        for (i in game.players) {
            if (game.players.hasOwnProperty(i)) {
                player = game.players[i];
                
                player.deck = new cards.cardHolder();
                player.turn = false;
                player.bigBlind = false;
                player.smallBlind = false;
            }
        }
    }
     
    function gameStart() {
        randUtils.shuffle(game.signups, cards.useArc4 ? 'ARC4' : 'SIMPLE');
        
        game.ticks = -1;
        game.state = 'started';
        game.signups.forEach(function (player) {
            game.players[player.toLowerCase()] = {
                name: player,
                deck: new cards.cardHolder(),
                turn: false,
                bigBlind: false,
                smallBlind: false
            };
        });
        
        gamestate_start();
    }
    
    function step() {
        --game.ticks;
        
        if (game.ticks === 0) {
            game.nextState();
        }
    }
    
    resetGame();
    
    // game states
    function gamestate_start() {
        var x,
            i,
            player;
        
        for (x = 0; x < 2; ++x) {
            for (i in game.players) {
                if (game.players.hasOwnProperty(i)) {
                    player = game.players[i];
                    player.deck.add(game.deck.draw());
                }
            }
        }
        
        playerSet(0, 'bigBlind', true);
        playerSet(1, 'smallBlind', true);
        casino.coins[playerGet(0).name] -= cards.bigBlind;
        casino.coins[playerGet(1).name] -= cards.smallBlind;
        
        broadcast("");
        broadcast("There are " + Object.keys(game.players).length + " players [" + game.signups.join(', ') + "].");
        broadcast(playerGet(0).name + " has the big blind [5 coins].");
        broadcast(playerGet(1).name + " has the small blind [3 coins].");
        broadcast("There are " + game.pot + " coins in the pot.");
        broadcast("The raise limit is " + cards.raiseLimit + ".");
        broadcast("");
        
        for (i in game.players) {
            if (game.players.hasOwnProperty(i)) {
                player = game.players[i];
                if (sys.id(player.name) !== undefined) {
                    send(sys.id(player.name), "You currently have " + casino.coins[player.name.toLowerCase()] + " coins.");
                    send(sys.id(player.name), "Your cards [type /cards to see them again]:");
                    send(sys.id(player.name), player.deck[0].unicodeString() + " | " + player.deck[1].unicodeString());
                }
            }
        }
        
        game.nextState = gamestate_preflop;
        game.nextState();
    }
    
    function gamestate_preflop() {
        playerSet(0, 'turn', true);
        
        broadcast("");
        broadcast("It's " + playerGet(0).name + "'s turn.");
        broadcast("");
        
        turnHelp();
        game.nextState = gamestate_flop;
    }
    
    function gamestate_flop() {
        playerSet(0, 'turn', true);
        
        broadcast("");
        broadcast("It's " + playerGet(0).name + "'s turn.");
        broadcast("");
        
        turnHelp();
        game.nextState = gamestate_turn;
    }
    
    function gamestate_turn() {
        playerSet(0, 'turn', true);
        
        broadcast("");
        broadcast("It's " + playerGet(0).name + "'s turn.");
        broadcast("");
        
        turnHelp();
        game.nextState = gamestate_river;
    }
    
    function gamestate_river() {
        playerSet(0, 'turn', true);
        
        broadcast("");
        broadcast("It's " + playerGet(0).name + "'s turn.");
        broadcast("");
        
        turnHelp();
        game.nextState = gamestate_end;
    }
    
    function gamestate_end() {
        newRound();
    }
    
    function nextPlayer() {
        broadcast("");
        broadcast(playerGet(game.currentPlayer).name + "'s turn ended.");
        
        playerSet(game.currentPlayer, 'turn', false);
        
        ++game.currentPlayer;
        
        if (playerGet(game.currentPlayer) === undefined) {
            game.currentPlayer = 0;
            return game.nextState();
        }
        
        broadcast("It's " + playerGet(game.currentPlayer).name + "'s turn.");
        broadcast("");
        
        playerSet(game.currentPlayer, 'turn', true);
    }
    
    function turnHelp() {
        var id = sys.id(playerGet(game.currentPlayer).name);
        
        if (id === undefined || !sys.isInChannel(id, casino.chan)) {
            broadcast(playerGet(game.currentPlayer).name + " is not here..");
            return nextPlayer();
        }
        
        broadcast("Possible actions:");
        broadcast("Fold [/fold]");
    }
    
    return {
        handleCommand: function (src, message, channel) {
            try {
                return handleCommand(src, message, channel);
            } catch (e) {
                if (e !== "invalid command") {
                    broadcast("Error with poker command " + message.split(' ')[0] + ": " + e + " on " + e.lineNumber + ".");
                }
            }
        },
        step: step
    };
};