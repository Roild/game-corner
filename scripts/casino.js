/*jslint es5: true, evil: true, plusplus: true, sloppy: true, vars: true*/
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys:true, sendChanHtmlAll:true, module:true, SESSION:true, casinochan, casinobot, script, require, kickbot, poker, bot, staffchannel */
module.exports = (function () {
    var casino = this,
        casinochan,
        casinoCommandCooldown = 2, // in seconds. only applies to cal, craps, and slots.
        defaultMaster = "BeastCharizard",
        defaultChannel = "Casino";
  
    var utilities = require('utilities.js'),
 //       Poker = require('poker.js'),
        isNonNegative = utilities.is_non_negative;
    
	var jackpot = 1000,
        stepTimer = 0;
    
    var cooldowns = [];
    
    //this.memoryHash = new (require('memoryhash.js'))('casino-data.json');
    this.coins = {};//JSON.parse((casino.memoryHash.get('coins') || "{}"));
    this.chan = undefined;
    
 /*   try {
        this.poker = new Poker(casino);
    } catch (e) {
        if (staffchannel) {
            bot.sendAll("Couldn't load poker: " + e, staffchannel);
        }
        
        this.poker = {handleCommand: function () {}, step: function () {}};
    }
   */ 
	this.playCAL = function (src, commandData) {
        var bet,
            calnumber,
            dice1,
            dice2,
            dice3,
            caldice,
            payout;
        
		if (!isNonNegative(casino.coins[sys.name(src).toLowerCase()]) || casino.coins[sys.name(src).toLowerCase()] <= 0) {
			casino.coins[sys.name(src).toLowerCase()] = 100;
		}
		if (commandData === undefined) {
			return;
		}
		if (casino.coins[sys.name(src).toLowerCase()] <= 0) {
			casinobot.sendMessage(src, "You don't have any coins so you are not able to play.", casinochan);
			return;
		}
		bet = commandData.split(":")[0];
        calnumber = commandData.split(":")[1];
        if (isNaN(bet) || isNaN(calnumber)) {
            casinobot.sendMessage(src, "You use it like /cal [number you are betting]:[number you want to get].", casinochan);
            return;
        }
        if (casino.coins[sys.name(src).toLowerCase()] < bet) {
            casinobot.sendMessage(src, "You don't have enough coins to make that bet.", casinochan);
			return;
        }
        if (bet > 100) {
            casinobot.sendMessage(src, "The max bet is 99 coins.", casinochan);
            return;
        }
        if (calnumber >= 19) {
			casinobot.sendMessage(src, "That is not a result that 3 dice can make", casinochan);
			return;
        }

        dice1 = Math.floor((Math.random() * 6) + 1);
        dice2 = Math.floor((Math.random() * 6) + 1);
        dice3 = Math.floor((Math.random() * 6) + 1);
        casino.coins[sys.name(src).toLowerCase()] -= bet;
        caldice = dice1 + dice2 + dice3;
        if (caldice === calnumber) {
            if (calnumber === 3 || calnumber === 18) {
                payout = bet * 8;
            } else if (calnumber === 4 || calnumber === 17) {
                payout = bet * 7;
            } else if (calnumber === 5 || calnumber === 16) {
                payout = bet * 6;
            } else if (calnumber === 6 || calnumber === 15) {
                payout = bet * 5;
            } else if (calnumber === 7 || calnumber === 14) {
                payout = bet * 4;
            } else if (calnumber === 8 || calnumber === 13) {
                payout = bet * 3;
            } else if (calnumber === 9 || calnumber === 12) {
                payout = bet * 2;
            } else if (calnumber === 10 || calnumber === 11) {
                payout = bet;
            }
            
            casinobot.sendMessage(src, "You rolled a " + caldice + " and matched your number!! You get " + payout + " coins!", casinochan);
            casino.coins[sys.name(src).toLowerCase()] += payout;
            if (payout >= 400) {
                casinobot.sendAll(sys.name(src) + " just got a huge payout of " + payout + " coins!!!!");
            }
            return;
        } else {
            casinobot.sendMessage(src, "Sorry you rolled a " + caldice + ".  You lost " + bet + " coins!", casinochan);
            return;
        }
	};
    this.playCraps = function (src, commandData) {
        var bet,
            dice1,
            dice2,
            crapsdice,
            payout;
        
        if (!casino.coins.hasOwnProperty(src)) {
            casino.coins[sys.name(src).toLowerCase()] = 100;
        }
        if (commandData === undefined) {
            return;
        }
        if (casino.coins[sys.name(src).toLowerCase()] <= 0) {
            casinobot.sendMessage(src, "You don't have any coins so you are not able to play.", casinochan);
            return;
        }
        bet = commandData;
        if (isNaN(bet)) {
            casinobot.sendMessage(src, "You use it like /craps [number of coins you are betting].", casinochan);
            return;
        }
        if (casino.coins[sys.name(src).toLowerCase()] < bet) {
            casinobot.sendMessage(src, "You don't have enough coins to make that bet.", casinochan);
            return;
        }
        if (bet > 100) {
            casinobot.sendMessage(src, "The max bet is 99 coins.", casinochan);
            return;
        }
        dice1 = Math.floor((Math.random() * 6) + 1);
        dice2 = Math.floor((Math.random() * 6) + 1);
        casino.coins[sys.name(src).toLowerCase()] -= bet;
        crapsdice = dice1 + dice2;
        if (crapsdice === 7 || crapsdice === 11) {
            payout = bet * 2.5;
            casinobot.sendMessage(src, "You rolled a " + crapsdice + " and got " + payout + " coins!", casinochan);
            casino.coins[sys.name(src).toLowerCase()] += payout;
            return;
        } else if (crapsdice === 4 || crapsdice === 5 || crapsdice === 6 || crapsdice === 8 || crapsdice === 9 || crapsdice === 10) {
            var extra1 = Math.floor((Math.random() * 6) + 1),
                extra2 = Math.floor((Math.random() * 6) + 1),
                extra = extra1 + extra2;
            if (crapsdice === extra) {
                payout = bet * 1.75;
                casinobot.sendMessage(src, "You rolled a " + crapsdice + " and a " + extra + " and got " + payout + " coins!", casinochan);
                casino.coins[sys.name(src).toLowerCase()] += payout;
                return;
            } else {
                casinobot.sendMessage(src, "Your two rolls of " + crapsdice + " and " + extra + " didn't match so you lost " + bet + " coins.", casinochan);
                return;
            }
        } else {
            casinobot.sendMessage(src, "You rolled a " + crapsdice + " and lost " + bet + " coins!", casinochan);
            return;
        }
    };
	this.playSlots = function (src) {
        var slot;
		if (!casino.coins.hasOwnProperty(src)) {
            casino.coins[sys.name(src).toLowerCase()] = 100;
        }
		if (casino.coins[sys.name(src).toLowerCase()] <= 0) {
			casinobot.sendMessage(src, "You don't have any coins so you are not able to play.", casinochan);
			return;
		}
		casino.coins[sys.name(src).toLowerCase()] -= 1;
		slot = Math.floor((Math.random() * 300) + 1);
		if (slot === 1) {
			casino.coins[sys.name(src).toLowerCase()] += jackpot;
			casinobot.sendMessage(src, "You hit the jackpot!!!  You got " + jackpot + " coins!", casinochan);
			casinobot.sendAll(sys.name(src) + " just hit the jackpot and got " + jackpot + " coins in #casino!!!!!");
			jackpot = 1000;
			return;
		}
		if (slot <= 5) {
			casino.coins[sys.name(src).toLowerCase()] += 150;
			casinobot.sendMessage(src, "You hit a great number and got 150 coins!!!", casinochan);
			jackpot += 1;
			return;
		}
		if (slot <= 14) {
			casino.coins[sys.name(src).toLowerCase()] += 100;
			casinobot.sendMessage(src, "You hit a good number and got 100 coins!!", casinochan);
			jackpot += 1;
			return;
		}
		if (slot <= 30) {
			casino.coins[sys.name(src).toLowerCase()] += 50;
			casinobot.sendMessage(src, "You hit an okay number and got 50 coins!", casinochan);
			jackpot += 1;
			return;
		}
		if (slot <= 53) {
			casino.coins[sys.name(src).toLowerCase()] += 10;
			casinobot.sendMessage(src, "Your got lucky and won 10 coins.", casinochan);
			jackpot += 1;
			return;
		}
		if (slot <= 85) {
			casino.coins[sys.name(src).toLowerCase()] += 2;
			casinobot.sendMessage(src, "You got 2 coins.  It is better than nothing.", casinochan);
			jackpot += 1;
			return;
		} else {
			casinobot.sendMessage(src, "Your luck wasn't good enough for you to win. Better luck next time.", casinochan);
			jackpot += 1;
			return;
		}
	};
    this.showGames = function (src, commandData) {
        var games = [
            "Chuck-a-luck - Choose any number that 3 dice can make.  If the dice come up with your number you win.",
            "Craps - Roll the dice if you get 7 or 11 get 5 times your bet. Role a 4,5,6,8,9,10 then you roll another pair of dice and if they number match you get double your bet. Role 2 or 12 and you lose.",
            "Slots - Press your luck with this game.  You better hope your lucky number comes up."
        ];
        
        games.forEach(function (msg) {
            casinobot.sendMessage(src, msg, casinochan);
        });
    };
    this.showmyCoins = function (src) {
        var myCoins = casino.coins[sys.name(src).toLowerCase()];
        casinobot.sendMessage(src, "You have " + myCoins + " coins right now.", casinochan);
        return;
    };
    this.showJackpot = function (src) {
        casinobot.sendMessage(src, "The current jackpot is " + jackpot + " coins!", casinochan);
        return;
    };
    this.showHelp = function (src, commandData) {
        commandData = commandData.toLowerCase();
        if (commandData === "chuck" || commandData === "cal" || commandData === "chuck a luck") {
            casinobot.sendMessage(src, "To play type /cal [bet]:[number you are trying to hit]. bet is how many coins you are risking and number is the number you are trying to roll.", casinochan);
            return;
        } else if (commandData === "craps") {
            casinobot.sendMessage(src, "To play type /craps [bet].  bet is how many coins you are risking.");
            return;
        } else if (commandData === "slots") {
            casinobot.sendMessage(src, "To play type /slots. You winning depend on how lucky you are.");
            return;
        } else {
            var help = [
                "",
                "Type /help cal or /help chuck a luck to learn how to play Chuck a Luck.",
                "Type /help craps to learn how to play Craps.",
                "Type /help slots to learn how to play Slots.",
                "",
                "/cal bet:number To Play Chuck A Luck.",
                "/craps bet To play Craps",
                "/games To see all the games you are able to play.",
                "/mycoins To find out how many coins you have.",
                ""
            ];
            
            help.forEach(function (msg) {
                casinobot.sendMessage(src, msg, casinochan);
            });
            return;
        }
    };
    this.showCommands = function (src, commandData) {
        var some = [
            "Commands:",
            "/cal bet:number  To Play Chuck A Luck.",
            "/craps bet  To play Craps",
            "/help To learn how to play the games.",
            "/games To see all the games you are able to play.",
            "/mycoins To find out how many coins you have."
		];
        
        some.forEach(function (msg) {
            try {
                casinobot.sendMessage(src, msg, casinochan);
            } catch (err) {
                kickbot.sendAll("Error: " + err);
            }
        });
	};
    this.casinocommands = {
        user: {
            cal: [this.playCAL, "To play Chuck A Luck. Used like /cal bet:number"],
            craps: [this.playCraps, "To play Craps. Used like /craps bet"],
	        slots: [this.playSlots, "To play the slots. Used like /slots"],
            help: [this.showHelp, "To learn how to play the games."],
            games: [this.showGames, "To see all the games you can play."],
            jackpot: [this.showJackpot, "To see what the current jackpot is."],
            mycoins: [this.showmyCoins, "To find out how many coins you have."],
            casinocommands: [this.showCommands, "To see a list of possible commands."]
        }
	};
    this.handleCommand = function (src, message, channel) {
        var command,
            commandData,
            pos = message.indexOf(' ');
        
        if (channel !== casinochan) {
            return;
        }
        
      //  if (this.poker.handleCommand(src, message, channel) === true) {
        //    return true;
       // }
        
        if (pos !== -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos + 1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        
        if (['cal', 'craps', 'slots'].indexOf(command) !== -1) {
            if (cooldowns.indexOf(src) !== -1) {
                casinobot.sendMessage(src, "Don't be so eager to lose all your coins", casinochan);
                return;
            }
            cooldowns.push(src);
            sys.setTimer(function () {
                cooldowns.splice(cooldowns.indexOf(src), 1);
            }, casinoCommandCooldown, false);
        }
        
        if (casino.casinocommands.user.hasOwnProperty(command)) { //Ricetip: You will need this block to make commands work.
            casino.casinocommands.user[command][0].call(casino, src, commandData);
            return true;
        }
	};
    this.init = function () {
        var name = defaultChannel;
        if (sys.existChannel(name)) {
            casinochan = sys.channelId(name);
        } else {
            casinochan = sys.createChannel(name);
        }
        casino.chan = casinochan;
        SESSION.global().channelManager.restoreSettings(casinochan);
        SESSION.channels(casinochan).perm = true;
        SESSION.channels(casinochan).master = defaultMaster;
    };
    this.beforeChannelJoin = function (src, channel) {
        if (channel !== casinochan) {
            return false;
        }
        return false;
    };
    return { //Ricetip: You will probably need this. You can add/renive other events here, just make sure the methods exist!
        init: casino.init,
        handleCommand: casino.handleCommand,
        beforeChannelJoin: casino.beforeChannelJoin,
        step: function () {
            //if (++stepTimer % 60) { // every minute
              //  casino.memoryHash.add('coins', JSON.stringify(this.coins));
            //}
            
           // this.poker.step();
        }
    };
}());
