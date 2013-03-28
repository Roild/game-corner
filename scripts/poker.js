/*jslint es5: true, evil: true, plusplus: true, sloppy: true, vars: true*/
/*global module, require, sys, casinobot, Config, broadcast, send, gamestate_start, resetGame*/

(function () {
    var cards = require('cards.js');
    
    cards.generators.cardHolder = function () {};
    cards.Deck.createType('cardHolder', 'cardHolder');
    cards.useArc4 = true; // change this if it lags too much
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
            cards: function (src, data) {
                var self,
                    cards = [];
                if (game.state !== 'started') {
                    return send(src, "The game hasn't even started yet.");
                }
                if ((self = game.players[sys.name(src).toLowerCase()]) === undefined) {
                    return send(src, "You never joined the game!");
                }
                
                self.deck.forEach(function (card, index, deck) {
                    cards.push(card.unicodeString());
                });
                
                send(src, "Your cards:");
                send(src, cards.join(' | '));
            }
        },
        mod: {
            start: function (src, data) {
                game.state = 'signup';
                game.nextState = gamestate_start;
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
        
        if (commands.user.hasOwnProperty(command)) {
            commands.user[command].call(module_scope, src, commandData);
            return true;
        }
    }
    
    function broadcast(msg) {
        casinobot.sendAll(msg, casino.chan);
    }
    
    function send(src, msg) {
        casinobot.sendMessage(src, msg, casino.chan);
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
            state: 'none'
        };
    }
    
    function step() {
        --game.ticks;
        
        if (game.ticks === 0) {
            game.nextState();
        }
    }
    
    resetGame();
        
    // game states
    function gamestate_start() { // when the signups have ended
        var x,
            i,
            player,
            keys;
        
        // big/small blind commented out for now.
        game.ticks = -1;
        game.state = 'started';
        game.signups.forEach(function (player) {
            game.players[player.toLowerCase()] = {
                name: player,
                deck: new cards.cardHolder(),
                // bigBlind: false,
               // smallBlind: false
            };
        });
        
        for (x = 0; x < 2; ++x) {
            for (i in game.players) {
                if (game.players.hasOwnProperty(i)) {
                    player = game.players[i];
                    player.deck.add(game.deck.draw());
                }
            }
        }
        
        //keys = Object.keys(game.players);
        //game.players[keys[0]].bigBlind = true;
        //game.players[keys[1]].smallBlind = true;
    }
    
    function gamestate_preflop() {
        
    }
    
    function gamestate_flop() {
        
    }
    
    function gamestate_turn() {
        
    }
    
    function gamestate_river() {
        
    }
    
    return {
        handleCommand: function (src, message, channel) {
            try {
                return handleCommand(src, message, channel);
            } catch (e) {
                broadcast("Error with poker command " + message.split(' ')[0] + ": " + e + " on " + e.lineNumber + ".");
            }
        },
        step: step
    };
};