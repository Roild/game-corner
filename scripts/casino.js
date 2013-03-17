/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys:true, sendChanHtmlAll:true, module:true, SESSION:true, casinochan, casinobot, script */
module.exports = function () {
    var casino = this;
    var casinochan = "Casino";

    var defaultMaster = "BeastCharizard";
    var defaultChannel = "Casino";
  
	var coins = 100;
	var payout;
	var caldice;
	var crapsdice;
	var calnumber;
	var crapsnumber;
	var bet;
	var myCoins;
	var dice1;
	var dice2;
	var dice3;
	var slot;
	var jackpot = 1000;
	
	
	this.playCAL = function(src, commandData){
		if(commandData === undefined){
			return;
		}
		if(coins[sys.name(src)] <= 0){
			casinobot.sendMessage(src, "You don't have any coins so you are not able to play.", casinochan);
			return;
		}
		bet = commandData.split(":")[0];
        calnumber = commandData.split(":")[1];
        if(coins[sys.name(src)] < bet){
			casinobot.sendMessage(src, "You don't have enough coins to make that bet.", casinochan);
			return;
        }
        if(calnumber >= 19){
			casinobot.sendMessage(src, "That is not a result that 3 dice can make", casinochan);
			return;
        }

        dice1 = Math.floor((Math.random()*6)+1);
        dice2 = Math.floor((Math.random()*6)+1);
        dice3 = Math.floor((Math.random()*6)+1);
        coins[sys.name(src)] -= bet;
        caldice = dice1 + dice2 + dice3;
        if(caldice === calnumber){
            if(calnumber === 3 || calnumber === 18){
                payout = bet*8;
            }
            else if(calnumber === 4 || calnumber === 17){
                payout = bet*7;
            }
            else if(calnumber === 5 || calnumber === 16){
                payout = bet*6;
            }
            else if(calnumber === 6 || calnumber === 15){
                payout = bet*5;
            }
            else if(calnumber === 7 || calnumber === 14){
                payout = bet*4;
            }
            else if(calnumber === 8 || calnumber === 13){
                payout = bet*3;
            }
            else if(calnumber === 9 || calnumber === 12){
                payout = bet*2;
            }
            else if(calnumber === 10 || calnumber === 11){
                payout = bet*1;
            }
            casinobot.sendMessage(src, "You rolled a " +caldice+" and matched your number!! You get " + payout+ " coins!", casinochan);
            coins[sys.name(src)] += payout;
          if(payout >= 500){
                casinobot.sendAll(sys.user(src) + "just got a huge payout of " +payout+ " coins!!!!");
          }
            caldice = undefined;
            dice1 = undefined;
            dice2 = undefined;
            dice3 = undefined;
            crapsnumber = undefined;
            bet = undefined;
            return;
            }
        else{
            casinobot.sendMessage(src, "Sorry you rolled a " +caldice+".  You lost " +bet+ " coins!", casinochan);
            caldice = undefined;
            dice1 = undefined;
            dice2 = undefined;
            dice3 = undefined;
            return;
        }
        if(coins[sys.name(src)] <= 0){
            coins[sys.name(src)] += 100;
        }
	};
this.playCraps = function (src, commandData){
		if(commandData === undefined){
			return;
		}
		if(coins[sys.name(src)] <= 0){
			casinobot.sendMessage(src, "You don't have any coins so you are not able to play.", casinochan);
			return;
		}
        if(coins[sys.name(src)] < bet){
			casinobot.sendMessage(src, "You don't have enough coins to make that bet.", casinochan);
			return;
        }
        if(calnumber >= 13){
			casinobot.sendMessage(src, "That is not a result that 3 dice can make", casinochan);
			return;
        }
		bet = commandData;
		dice1 = Math.floor((Math.random()*6)+1);
		dice2 = Math.floor((Math.random()*6)+1);
		coins[sys.name(src)] -= bet;
	crapsdice = dice1 + dice2;
		if(crapsdice === 7 || crapsdice === 11){
			payout = bet*5;
			casinobot.sendMessage(src, "You rolled a " +crapsdice+ " and got " +payout+ " coins!", casinochan);
			coins[sys.name(src)] += payout;
          if(payout >= 500){
			casinobot.sendAll(sys.user(src) + "just got a huge payout of " +payout+ " coins!!!!", casinochan);
			return;
          }
		}
		else if(crapsdice === 4 || crapsdice === 5 || crapsdice === 6 || crapsdice === 8 || crapsdice === 9 || crapsdice === 10){
			payout = bet*2;
			casinobot.sendMessage(src, "You rolled a " +crapsdice+ " and got " +payout+ " coins!", casinochan);
			coins[sys.name(src)] += payout;
			return;
		}
		else{
			casinobot.sendMessage(src, "You rolled a " +crapsdice+ " and lost " +bet+ " coins!", casinochan);
			coins[sys.name(src)] -= bet;
			return;
		}
		dice1 = undefined;
		dice2 = undefined;
		crapsdice = undefined;
		if(coins[sys.name(src)] <= 0){
			coins[sys.name(src)] += 100;
		}
		};
	this.playSlots = function (src){
		if(coins[sys.name(src)] <= 0){
			casinobot.sendMessage(src, "You don't have any coins so you are not able to play.", casinochan);
			return;
		}
		coins[sys.name(src)] -= 1;
		slot = Math.floor((Math.random()*200)+1);
		if(slot === 1){
			coins[sys.name(src)] += jackpot;
			casinobot.sendMessage(src, "You hit the jackpot!!!  You got " +jackpot+ " coins!", casinochan);
			casinobot.sendAll(sys.user(src) + " just hit the jackpot and got " +jackpot+ " coins!!!!!");
			slot = undefined;
			jackpot = 1000;
			return;
		}
		else if(2<= slot <= 8){
			coins[sys.name(src)] += 200;
			casinobot.sendMessage(src, "You hit a great number and got 200 coins!!!", casinochan);
			jackpot += 1;
			return;
		}
		else if(9<= slot <= 18){
			coins[sys.name(src)] += 150;
			casinobot.sendMessage(src, "You hit a good number and got 150 coins!!", casinochan);
			jackpot += 1;
			return;
		}
		else if(19 <= slot <= 35){
			coins[sys.name(src)] += 100;
			casinobot.sendMessage(src, "You hit an okay number and got 100 coins!", casinochan);
			jackpot += 1;
			return;
		}
		else if(36 <= slot <= 75){
			coins[sys.name(src)] += 50;
			casinobot.sendMessage(src, "Your got lucky and won 50 coins.", casinochan);
			jackpot += 1;
			return;
		}
		else if(76 <= slot <= 125){
			coins[sys.name(src)] += 2;
			casinobot.sendMessage(src, "You got 2 coins.  It is better than nothing.", casinochan);
			jackpot += 1;
			return;
		}
		else {
			casinobot.sendMessage(src, "Your luck wasn't good enough for you to win. Better luck next time.", casinochan);
			jackpot +=1;
			return;
		}
		slot = undefined;
		if(coins[sys.name(src)] <= 0){
			coins[sys.name(src)] += 100;
		}
	};
this.showGames = function (){
	var games = [
		"",
		"+Dealer: Chuck-a-luck - Choose any number that 3 dice can make.  If the dice come up with your number you win.",
		"+Dealer: Craps - Roll the dice if you get 7 or 11 get 5 times your bet. Role a 4,5,6,8,9,10 and get double your bet. Role 2 or 12 and you lose.",
		"+Dealer: Slots - Press your luck with this game.  You better hope your lucky number comes up.",
		""
    ];
    for (var i in games) {
        casinobot.sendMessage(src, games[i], casinochan);
    }
};
this.showmyCoins = function (src){
	myCoins = coins[sys.name(src)];
	casinobot.sendMessage(src, "You have " +myCoins+ " coins right now.", casinochan);
	return;
};
this.showHelp = function (commandData){
	if(commandData == "chuck" || commandData == "cal" || commandData == "chuck a luck"){
		casinobot.sendMessage(src, "To play type /sAL bet:number. bet is how many coins you are risking and number is the number you are trying to roll.", casinochan);
		return;
	}
	else if(commandData == "craps"){
		casinobot.sendMessage(src, "To play type /sraps bet.  bet is how many coins you are risking.", casinochan);
		return;
	}
    else if(commandData == "slots"){
        casinobot.sendMessage(src, "To play type /slots. You winning depend on how lucky you are.", casinochan);
        return;
	}
	else{
        
		var help = [
		"",
		"Type /help CAL or /help Chuck a Luck to learn how to play Chuck a Luck.",
		"Type /help Craps to learn how to play Craps.",
		""
		];
        for (var i in help) {
		sys.sendMessage(src, help[i]);
        }
		return;
	}
};
    this.showCommands = function () {
		var some = [
		"",
		"Commands:",
		"/cal bet:number  To Play Chuck A Luck.",
		"/craps bet  To play Craps",
		"/help To learn how to play the games.",
		"/game To see all the games you are able to play.",
		"/mycoins To find out how many coins you have.",
		""
		];
        kickbot.sendAll("NOWAI", casinochan);
        
        for (var i in some) {
            try {
                casinobot.sendMessage(src, some[i], casinochan);
            } catch (err) {
                kickbot.sendAll("Error: " + err);
            }
        }
	};		
 this.casinocommands = {
        user: {
            cal: [this.playCAL, "To play Chuck A Luck. Used like /cal bet:number"],
            craps: [this.playCraps, "To play Craps. Used like /craps bet"],
			slots: [this.playSlots, "To play the slots. Used like /slots"],
            help: [this.showHelp, "To learn how to play the games."],
            games: [this.showGames, "To see all the games you can play."],
            mycoins: [this.showmycoins, "To find out how many coins you have."],
			casinocommands: [this.showCommands, "To see a list of possible commands."]
        }
	};
this.handleCommand = function (src, message, channel) {
        var command;
        var commandData;
        var pos = message.indexOf(' ');
        if (pos !== -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos + 1);
        }
		else {
            command = message.substr(0).toLowerCase();
        }
        if (channel !== casinochan) {
            return;
        }
        if (command in casino.casinocommands.user) { //Ricetip: You will need this block to make commands work.
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
        beforeChannelJoin: casino.beforeChannelJoin
    };
}();
