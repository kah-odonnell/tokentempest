(function (window) {
	var BattleInfoSwirl = function(battleController, player_npc) {
		this.initialize(battleController, player_npc);
	}
	var bu = BattleInfoSwirl.prototype = new createjs.Container();
	bu.Container_initialize = bu.initialize;
	bu.initialize = function(battleController, player_npc) {
		this.Container_initialize();
		this.bc = battleController;
		var swirl = new createjs.Bitmap(loader.getResult("infoswirl"));
		var name = player_npc.battlename;
		var namecontainer = new createjs.Container();
		for (var i = 0; i < 6; i++) {
			var nametext1 = new createjs.Text(name, "22px crazycreation", "#000000");			
			var color = "#FFFFFF";
			nametext1.shadow = new createjs.Shadow(color, 0, 0, 4);
			namecontainer.addChild(nametext1);
		}
		namecontainer.addChild(nametext2)
		var nametext2 = new createjs.Text(name, "22px crazycreation", "#000000");
		if (player_npc.is_player) {
			this.owner = "blue";
			swirl.x = 0;
			swirl.y = 0;
			namecontainer.x = 10;
			namecontainer.y = 0;
		} else {
			this.owner = "red";
			swirl.scaleX = -1;
			swirl.x = canvas.width;
			swirl.y = 0;
			namecontainer.x = canvas.width - namecontainer.getBounds().width - 10;
			namecontainer.y = 0;
		}
		this.swirl = swirl;
		this.namecontainer = namecontainer;
		this.uniticons = [];
		this.countericons = [];
		this.num_units = 0;
		this.num_counters = 0;
		this.addChild(this.swirl);
		this.addChild(this.namecontainer);
		this.addUnits();
	}
	BattleInfoSwirl.prototype.addUnits = function() {
		var units = this.bc.getAllUnits(this.owner, false);
		this.num_units = units.length;
		for (var i = 0; i < units.length; i++) {
			var uniticon = new createjs.Bitmap(loader.getResult("unit"));
			var w = uniticon.getBounds().width;
			if (this.owner == "blue") {
				uniticon.x = this.swirl.getBounds().width - 40 - i*(w + 2);
			} else {
				uniticon.x = canvas.width - (this.swirl.getBounds().width - 22 - i*(w + 2));
			}
			uniticon.y += 2;
			this.uniticons.push(uniticon);
			this.addChild(this.uniticons[i]);
		}
	}
	BattleInfoSwirl.prototype.destroyUnit = function() {
		var old_icon = this.uniticons[this.num_units - 1];
		var old_x = old_icon.x;
		var old_y = old_icon.y;
		this.removeChild(old_icon);
		var image = new createjs.Bitmap(loader.getResult("unit"));
		image.x = old_x;
		image.y = old_y;
		var matrix = new createjs.ColorMatrix().adjustSaturation(-150);
		image.filters = [
		    new createjs.ColorMatrixFilter(matrix)
		];
		var bounds = image.getBounds();
		image.cache(bounds.x, bounds.y, bounds.width, bounds.height);
		this.addChild(image);
		this.num_units--;

	}
	BattleInfoSwirl.prototype.addCounter = function() {
		var counter = new createjs.Bitmap(loader.getResult("counter"));
		var w = counter.getBounds().width;
		if (this.owner == "blue") {
			counter.x = 22 + this.num_counters*(w + 2);
		} else {
			counter.x = canvas.width - (40 + this.num_counters*(w + 2));
		}
		counter.y = 28;
		this.countericons.push(counter);
		this.num_counters++;
		this.addChild(counter);
	}
	BattleInfoSwirl.prototype.removeCounter = function() {
		//var counter = this.countericons[this.num_counters - 1]
		this.removeChild(this.countericons[this.num_counters - 1]);
		var i = this.countericons.indexOf(this.countericons[this.num_counters - 1]);
		this.countericons.slice(i, 1);
		this.num_counters--;
	}
	BattleInfoSwirl.prototype.tick = function() {

	}
	window.BattleInfoSwirl = BattleInfoSwirl;
} (window));	
