/*global module, require, sys, casinobot, Config, broadcast, send*/

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
                // exceptions can be made to this.
                if (game.ips.indexOf(sys.ip(src))) {
                    return 
                }
            }
        },
        mod: {
            start: function (src, data) {
                game.state = 'signup';
                broadcast(sys.name(src) + " started a game of Texas Hold'em Poker! Type /joinp to join!");
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
            ips: [],
            state: 'none'
        };
    }
    
    resetGame();
        
    return {
        handleCommand: function (src, message, channel) {
            try {
                handleCommand(src, message, channel);
            } catch (e) {
                broadcast("Error with poker command " + message.split(' ')[0] + ": " + e + " on " + e.lineNumber + ".");
            }
        }
    };
};