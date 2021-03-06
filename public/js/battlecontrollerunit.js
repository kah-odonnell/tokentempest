(function (window) {
	var BattleControllerUnit = function() {

	};

	///////////////////////// BattleControllerChain Interaction /////////////////////////
	/* ~~~~~~~~~ SUMMON ~~~~~~~~~~~~ */
	//summoning a unit is done via the BattleControllerChain (the same mechanism used by Action Tokens)
	//if this unit is summoned, this data will be sent to the chain where it is processed
	//this method is to be overridden by the individual unit classes.
	BattleControllerUnit.prototype.getSummonData = function(location) {
		/*
		summon = {
			unit_unique_id: this.unique_id,
			action_effect_type: this.bc.chain.EFFECT.SUMMON,
			action_type: this.type,
			summon_location: location;
		}
		return summon;
		*/
		return null;
	}
	BattleControllerUnit.prototype.canSummon = function(location) {
		if (this.is_active) {
			return false;
		}
		var data = this.getSummonData(location);
		if (data != null) {
			return this.bc.chain.isPossible(data);
		} else {
			return false;
		}
	}
	BattleControllerUnit.prototype.summon = function(location) {
		var t = this.canSummon(location);
		if (t) {
			var data = this.getSummonData(location);
			this.bc.chain.finalizeData(data);
		}
	}
	/* ~~~~~~~~~ RESOLVE ~~~~~~~~~~~~ */
	BattleControllerUnit.prototype.getResolveSummonData = function(location) {
		/*
		summon = {
			unit_unique_id: this.unique_id,
			action_effect_type: this.bc.chain.EFFECT.SUMMON,
			action_type: this.type,
			summon_location: location;
		}
		return summon;
		*/
		return null;
	}
	BattleControllerUnit.prototype.canResolveSummon = function(location) {
		var data = this.getResolveSummonData(location);
		if (data != null) {
			return this.bc.chain.isPossible(data);
		} else {
			return false;
		}
	}
	BattleControllerUnit.prototype.resolveSummon = function(location) {
		var t = this.getResolveSummonData(location);
		if (t) {
			this.is_active = true;
			this.is_resolved = true;
			if (this.owner == "red") {
				location.RED.occupied = true;
				this.summoning_location = location.RED;
			} else {
				location.BLUE.occupied = true;
				this.summoning_location = location.BLUE;
			}
			var data = this.getResolveSummonData(location);
			this.bc.chain.finalizeData(data);
		}
	}
	///////////////////////// End of BattleControllerChain Interaction /////////////////////////

	BattleControllerUnit.prototype.removeCounter = function(action) {
		var i = this.counters.indexOf(action);
		this.counters.splice(i, 1);
	}
	BattleControllerUnit.prototype.addCounter = function(action) {
		this.counters.push(action);
	}
	BattleControllerUnit.prototype.increaseMana = function() {
		this.mana++;
	}
	BattleControllerUnit.prototype.revoke = function() {
		this.is_active = false;
		return true;
	}
	BattleControllerUnit.prototype.getMana = function() {
		return this.mana;
	}
	BattleControllerUnit.prototype.changeMana = function(value) {
		this.mana += value; //1, -1, etc. 
	}
	BattleControllerUnit.prototype.attack = function(target, power) {
		var final_unit_attack = this.raw_attack*(1+.5*this.stage_attack);
		var final_target_defense = target.raw_defense*(1+.5*target.stage_defense);
		var random = 1;
		var damage = ((2*this.level+10)/250)*(final_unit_attack/final_target_defense)*(power*100)*random;
		target.current_health -= damage;
		if (target.current_health <= 0) {
			this.bc.destroy(target);
		}
	}
	BattleControllerUnit.prototype.setCurrentHealth = function() {
		var health = Math.floor(2*this.base_stat_health*(this.level/100)) + this.level + 10;
		return health;
	}
	BattleControllerUnit.prototype.setCurrentAttack = function() {
		var attack = Math.floor(2*this.base_stat_attack*(this.level/100)) + 5;
		return attack;
	}
	BattleControllerUnit.prototype.setCurrentDefense = function() {
		var defense = Math.floor(2*this.base_stat_defense*(this.level/100)) + 5;
		return defense;
	}
	BattleControllerUnit.prototype.setCurrentLuck = function() {
		var luck = Math.floor(2*this.base_stat_luck*(this.level/100)) + 5;
		return luck;
	}
	BattleControllerUnit.prototype.getCurrentHealth = function() {
		var health = Math.floor(2*this.base_stat_health*(this.level/100)) + this.level + 10;
		return health;
	}
	BattleControllerUnit.prototype.getCurrentAttack = function() {
		var attack = this.raw_attack*(1+.5*this.stage_attack);
		return attack;
	}
	BattleControllerUnit.prototype.getCurrentDefense = function() {
		var defense = this.raw_defense*(1+.5*this.stage_defense);
		return defense;
	}
	BattleControllerUnit.prototype.getCurrentLuck = function() {
		var luck = Math.floor(2*this.base_stat_luck*(this.level/100)) + 5;
		return luck;
	}
	BattleControllerUnit.prototype.createUniqueId = function() {
		var id = "";
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		var unique = false
		while (unique == false) {
			id = "";
			for (var i = 0; i < chars.length; i++) {
				var j = Math.floor(Math.random() * (chars.length - 1))
				id = id + chars[j];
			}
			if (this.bc.getTokenByUniqueId(id) === null) {
				unique = true;
			}
		}
		this.unique_id = id;		
	}
	BattleControllerUnit.prototype.makeGraphic = function() {
		var card_image_name = this.card_img_name;
		var card_frame_name = this.frame_img_name;
		var attribute_image_name = this.attributes[0].attribute_icon_id;
		var whole_token = new createjs.Container();
		var token_art = new createjs.Bitmap(loader.getResult(card_image_name)); 
		var frame_art = new createjs.Bitmap(loader.getResult(card_frame_name)); 
		//var attribute_art = new createjs.Bitmap(loader.getResult(attribute_image_name)); 
		var imgs = [token_art, frame_art];
		for (var i = 0; i < imgs.length; i++) {
			var bounds = imgs[i].getBounds();
			imgs[i].regX = bounds.width/2;
			imgs[i].regY = bounds.height/2;
			whole_token.addChild(imgs[i]);
		}
		//whole_token.addChild(attribute_art);
		var total_bounds = whole_token.getBounds();
		whole_token.regX -= total_bounds.width/2;
		whole_token.regY -= total_bounds.height/2;
		whole_token.mouseChildren = false;
		return whole_token;
	}
	BattleControllerUnit.prototype.getGraphic = function() {
		return this.whole_token_img;
	}
	window.BattleControllerUnit = BattleControllerUnit;
} (window));