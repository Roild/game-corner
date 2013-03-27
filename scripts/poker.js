/*jslint es5: true, evil: true, plusplus: true, sloppy: true, vars: true*/
/*global module, require, sys, casinobot, Config, broadcast, send, gamestate_start, resetGame*/

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
                broadcast(sys.name(src) + " joined! " + game.ticks + " seconds left!");
            }
        },
        mod: {
            start: function (src, data) {
                game.state = 'signup';
                game.nextState = gamestate_start;
                game.ticks = 60;
                
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
        game.ticks = -1;
        game.signups.forEach(function (player) {
            game.players[player.toLowerCase] = {
                name: player
            }
        });
    }
    
    return {
        handleCommand: function (src, message, channel) {
            try {
                handleCommand(src, message, channel);
            } catch (e) {
                broadcast("Error with poker command " + message.split(' ')[0] + ": " + e + " on " + e.lineNumber + ".");
            }
        },
        step: step
    };
};