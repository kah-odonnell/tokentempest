//a singleton, responsible for making changes to the chain,
//processing events on the chain, 
//and determining the legality of action tokens
//
//initialized by BattleController()
(function (window) {
	var BattleControllerChain = function(bc) {
		this.TARGET = {
			ALL: {string: "ALL"},
			OPPONENT_ALL: {string: "OPPONENT_ALL"},
			OPPONENT_UNITS: {string: "OPPONENT_UNITS"},
			OPPONENT_MINIONS: {string: "OPPONENT_MINIONS"},
			OWNER_ALL: {string: "OWNER_ALL"},
			OWNER_UNITS: {string: "OWNER_UNITS"},
			OWNER_MINIONS: {string: "OWNER_MINIONS"},
		}
		this.EFFECT = {
			USE: {string: "USE"},
			RESOLVE: {string: "RESOLVE"},
			PREPARE: {string: "PREPARE"},
			ACTIVATE: {string: "ACTIVATE"},
			TRIGGER: {string: "TRIGGER"},
			NORMAL_SUMMON: {string: "NORMAL_SUMMON"},
			SPECIAL_SUMMON: {string: "SPECIAL_SUMMON"},
		}
		this.bc = bc;
		this.initialize();
	};
	//new token effects must be added to this function
	BattleControllerChain.prototype.isPossible = function(data) {
		var unit = this.bc.getTokenByUniqueId(data.unit_unique_id);
		var action = this.bc.getTokenByUniqueId(data.action_unique_id);
		if (action != null) {
			var attrs = action.attributes;
			var unit_has_attribute = false;
			for (var i = attrs.length - 1; i >= 0; i--) {
				if (unit.attributes.indexOf(attrs[i]) != -1) {
					unit_has_attribute = true;
				}
			}
			if (!unit_has_attribute) {
				return false;
			}
		}
		if ("change_mana" in data) {
			var effective_cost = data["change_mana"]
			if (unit.getMana() + effective_cost < 0) {
				return false;
			}
		}
		if ("select_target" in data) {
			var range = data["select_target"].target_type;
			if (this.getPossibleTargets(range, unit.owner).length < 1) {
				return false;
			}
		}
		if ("response_to" in data) {
			var d = action.getTriggerData(unit);
			var triggering_datasets = this.getTriggeringDatasets(d);
			if (triggering_datasets.length == 0) {
				return false;
			}
		}
		if ("summon_location" in data) {
			if (this.bc.getAvailableLocations(unit.owner).length < 1) {
				return false;
			}
			if (this.bc.getPlayer(unit.owner).has_normal_summoned && (data.action_effect_type == this.EFFECT.NORMAL_SUMMON)) {
				return false;
			}
		}
		return true;
	}
	//called by A) BattleControllerAction.use()/.activate()
	// or B) BattleButton/BattleAI
	// or C) this.resolveChain();
	//
	//new token effects must be added to this function
	BattleControllerChain.prototype.finalizeData = function(data) {
		this.bc.is_resolving = true;
		var action_id = data.action_unique_id;
		var unit_id = data.unit_unique_id;
		var unit = this.bc.getTokenByUniqueId(unit_id);
		var owner = unit.owner;
		var action = this.bc.getTokenByUniqueId(action_id);
		var memory = this.short_term[action_id];
		if (!memory) {
			this.short_term[action_id] = data;
			memory = this.short_term[action_id];
		}
		//if target_a is requested, target_a's unique_id is either already in memory,
		//or we need to let the player/ai add it to memory
		//if the latter, this function will get called a second time
		if ("select_target" in data) {
			var memory_id = "target_unique_id";
			var in_memory = false;
			if (memory["select_target"][memory_id]) in_memory = true;
			if (!(in_memory)) {
				var range = data.select_target.target_type; //this.TARGET.OPPONENT_ALL
				if (owner == "blue") this.bc.red_done = true;
				else this.bc.red_done = false;
				if (owner == "red") this.bc.blue_done = true;
				else this.bc.blue_done = false;
				this.bc.awaitInputTarget(owner, memory_id, range, data)
				return false;
			} else {
				//player/ai will set memory[memory_id] = BattleControllerUnit.unique_id
				//this.short_term.action_id.memory[1] = 7SADK83MD02..
			}
		}
		//if the action being evaluated has "response_to" : null, we must replace null
		//with the data that triggered this action
		if ("response_to" in data) {
			var in_memory = false;
			if (memory["response_to"]) in_memory = true;
			if (!(in_memory)) {
				var d = action.getTriggerData(unit);
				var triggering_datasets = this.getTriggeringDatasets(d);
				var resp = triggering_datasets[0];
				memory["response_to"] = resp;
			}
		}
		this.addToChain(data)
		return true;
	}
	//adds finalized data to the chain
	//called by this.resolveChain() -> this.finalizeData()
	//or BattleControllerAction.use()/.activate() -> this.finalizeData(),
	//but only after the data has all the input it needs to process
	BattleControllerChain.prototype.addToChain = function(data) {
		this.chain.push(data);
		this.processData(data);
		var action = this.bc.getTokenByUniqueId(data.action_unique_id);
		//determine whether we should wait for inputs
		var red_l = this.getTriggeredCounters("red").length;
		var blue_l = this.getTriggeredCounters("blue").length;
		if (red_l < 1) this.bc.red_done = true;
		else this.bc.red_done = false;
		if (blue_l < 1) this.bc.blue_done = true;
		else this.bc.blue_done = false;
		//determine user of action
		var owner = this.bc.getTokenByUniqueId(data.unit_unique_id).owner;
		//put game in a awaiting-input FSM state
		//input by the opponent of the owner of this unit is prioritized
		this.bc.awaitInputCounter(owner);
	}
	//gives/takes mana from units, inflicts damage, etc.
	//new token effects must be added to this function
	BattleControllerChain.prototype.processData = function(data) {
		var action_id = data.action_unique_id;
		var unit_id = data.unit_unique_id;
		var unit = this.bc.getTokenByUniqueId(unit_id);
		var owner = unit.owner;
		var action = this.bc.getTokenByUniqueId(action_id);
		var memory = this.short_term[action_id];
		if ("change_mana" in data) {
			unit.changeMana(data["change_mana"]);
		}
		if ("attack" in data) {
			//var memory_id = data.attack.memory_id;
			var power = data.attack.attack_power;
			var target_id = data.attack.target_unique_id;
			var target_unit = this.bc.getTokenByUniqueId(target_id);
			unit.attack(target_unit, power);
		}
		if ("negate_action" in data) {
			var target_action = this.bc.getTokenByUniqueId(data["negate_action"].action_unique_id);
			target_action.negate();
		}
		if ("consume_hand" in data) {
			var hand = this.bc.getHand(data["consume_hand"]);
			for (var i = 0; i < hand.length; i++) {
				this.bc.removeFromHand(hand[i]);
			}
		}
		if ("action_type" in data) {
			var is_prep_counter = (
				(data.action_type == this.bc.TYPE.COUNTER) && 
				(data.action_effect_type == this.EFFECT.USE)
			);
			var is_activate_counter = (
				(data.action_type == this.bc.TYPE.COUNTER) && 
				(data.action_effect_type == this.EFFECT.ACTIVATE)
			);
			var is_use_action = (
				(data.action_type != this.bc.TYPE.COUNTER) && 
				(data.action_effect_type == this.EFFECT.USE)
			);
			var is_resolve_action = (
				(data.action_effect_type == this.EFFECT.RESOLVE)
			);
			var is_summon_success_unit = (
				(data.action_effect_type == this.EFFECT.RESOLVE) &&
				(data.action_type == this.bc.TYPE.UNIT)
			);
			if (!(data.action_type == this.bc.TYPE.UNIT)) {
				if (is_prep_counter) {
					action.location = this.bc.LOCATION.UNIT;
				}
				if (is_use_action || is_activate_counter) {
					action.location = this.bc.LOCATION.CHAIN;
				}
				if (is_resolve_action) {
					action.location = this.bc.LOCATION.DECK;
				}
				if (is_activate_counter) {
					unit.removeCounter(action);
				}
				if (is_resolve_action && (action.type == this.bc.TYPE.COUNTER)) {

				}
			} else {
				if (is_summon_success_unit) {
					var loc = data.summon_location;
					this.bc.gui.summonToField(unit, loc);
					this.bc.getPlayer(unit.owner).has_normal_summoned = true;
				}
			}
		}
		this.bc.resetActionPane();
	}
	BattleControllerChain.prototype.prepareSummon = function(unit, location) {
		if (!(unit.canSummon(location))) return false;
		var chain_gui = this.bc.gui.chainPane;
		this.bc.is_resolving = true;
		//token appears in front of unit
		var appear = function() {
			chain_gui.appearUnitToken(unit);
		}
		//token moves to battlechaingui
		var move = function() {
			chain_gui.moveUnitTokenToChain(unit);
		}
		//process data
		var dodata = function() {
			unit.summon(location);
		}
		this.bc.addToTimeline(appear, 0);
		this.bc.addToTimeline(dodata, 0);
		this.bc.addToTimeline(move);
	}
	BattleControllerChain.prototype.prepareResolveSummon = function(unit, location) {
		if (!(unit.can_resolve)) return false;
		var chain_gui = this.bc.gui.chainPane;
		this.bc.is_resolving = true;
		this.bc.resetHand();
		//token says "resolved" on the chain
		var changeChain = function() {
			chain_gui.resolveUnitTokenOnChain(unit);
		}
		//resolve animation
		var animation = function() {
			var x;
		}
		//process resolve data
		var dodata = function() {
			unit.resolveSummon(location);
		}
		this.bc.addToTimeline(changeChain);
		this.bc.addToTimeline(dodata);
	}
	BattleControllerChain.prototype.prepareUse = function(action, unit) {
		if (!(action.canUse(unit))) return false;
		var chain_gui = this.bc.gui.chainPane;
		this.bc.is_resolving = true;
		this.bc.removeFromHand(action);
		if (action.type != this.bc.TYPE.COUNTER) {
			//token appears in front of unit
			var appear = function() {
				chain_gui.appearToken(action, unit);
			}
			//token moves to battlechaingui
			var move = function() {
				chain_gui.moveTokenToChain(action, unit);
			}
			//process data
			var dodata = function() {
				action.use(unit);
			}
			this.bc.addToTimeline(appear, 0);
			this.bc.addToTimeline(dodata, 0);
			this.bc.addToTimeline(move);
		} else {
			//counter prepare animation
			//maybe a sigil under the players themselves?
			unit.addCounter(action);
			if (action.owner == "red") {
				this.bc.gui.npcSwirl.addCounter();
			} else {
				this.bc.gui.playerSwirl.addCounter();
			}
			var prepareAnimation = function() {
				var x;
			}
			//process data
			var dodata = function() {
				action.use(unit);
			}
			this.bc.addToTimeline(dodata, 0);
		}
	}
	BattleControllerChain.prototype.prepareActivate = function(action, unit) {
		if (!(action.canActivate(unit))) return false;
		var chain_gui = this.bc.gui.chainPane;
		this.bc.is_resolving = true;
		this.bc.resetHand();
		if (action.owner == "red") {
			this.bc.gui.npcSwirl.removeCounter();
		} 
		else if (action.owner == "blue"){
			this.bc.gui.playerSwirl.removeCounter();
		} else console.log(action.name + " has no owner");
		this.bc.resetHand();
		//token appears in front of unit
		var appear = function() {
			chain_gui.appearToken(action, unit);
		}
		//token moves to battlechaingui
		var move = function() {
			chain_gui.moveTokenToChain(action, unit);
		}
		//activate animation
		var animation = function() {
			var x;
		}
		//process data
		var dodata = function() {
			action.activate(unit);
		}
		this.bc.addToTimeline(appear, 0);
		this.bc.addToTimeline(move);
		this.bc.addToTimeline(dodata);
	}
	BattleControllerChain.prototype.prepareResolve = function(action, unit) {
		if (!(action.canResolve(unit))) return false;
		var chain_gui = this.bc.gui.chainPane;
		this.bc.is_resolving = true;
		this.bc.resetHand();
		//token says "resolved" on the chain
		var changeChain = function() {
			chain_gui.resolveTokenOnChain(action, unit);
		}
		//resolve animation
		var animation = function() {
			var x;
		}
		//process resolve data
		var dodata = function() {
			action.resolve(unit);
		}
		this.bc.addToTimeline(changeChain);
		this.bc.addToTimeline(dodata);
	}
	BattleControllerChain.prototype.initialize = function() {
		this.chain = [];
		//short_term is set by BattleButton or BattleAI
		//BattleButton or BattleAI set red/blue_done true then call finalizeData()
		this.short_term = {
		//	i39029x2824csdw42: {
		//		target_a: kn289cma9e8u28323
		//	}
		};
	}
	BattleControllerChain.prototype.getTriggeringDatasets = function(trigger_data) {
		var list = []
		for (var i = this.chain.length - 1; i >= 0; i--) {
			var action_data = this.chain[i];
			var match = dict1_subsetOf_dict2(trigger_data, action_data);
			if (match) {				
				list.push(action_data);
			}
		}
		return list;
	}
	BattleControllerChain.prototype.getTriggeringActions = function(trigger_data) {
		var list = []
		for (var i = this.chain.length - 1; i >= 0; i--) {
			var action_data = this.chain[i];
			var match = dict1_subsetOf_dict2(trigger_data, action_data);
			if (match) {
				var action = this.bc.getTokenByUniqueId(this.chain[i].action_unique_id);				
				list.push(action);
			}
		}
		return list;
	}
	/*
	trigger_data = {
		target_a: unit.unique_id,
		action_type: this.bc.TYPE.ATTACK,
	}
	*/
	BattleControllerChain.prototype.getTriggeringUnits = function(trigger_data) {
		var list = [];
		for (var i = this.chain.length - 1; i >= 0; i--) {
			var action_data = this.chain[i];
			var match = dict1_subsetOf_dict2(trigger_data, action_data);
			if (match) {
				var unit = this.bc.getTokenByUniqueId(this.chain[i].unit_unique_id);				
				list.push(unit);
			}
		}
		return list;
	}
	BattleControllerChain.prototype.getUnitFromActiveActionUniqueId = function(action_unique_id) {
		var list = []
		for (var i = this.chain.length - 1; i>=0; i--) {
			var action_data = this.chain[i];
			if (action_data.unique_id == action_unique_id) {
				var unit = this.bc.getTokenByUniqueId(action_data.unit_unique_id)
				list.push(unit);
			}
		}
		if (list.length == 0) return null;
		else if (list.length == 1) return list[0];
		else {
			//console log an error if this list has more than one unique unit
			var most_recent = list[0];
			for (var i = 0; i < list.length; i++) {
				if (list[i] == most_recent) {
					most_recent = list[i];
				}
				else {
					console.log("ERROR: Two units are claiming the same action")
				}
			}
			return most_recent;
		}
	}
	BattleControllerChain.prototype.cleanShortTermData = function() {
		this.short_term = {};
	}
	//returns a list of dictionaries
	//each dictionary represents the effect each Action Token currently has on the chain
	//unresolved tokens return their getUseData() (from chain, after data is finalized)
	//resolved tokens return their getResolveData() (from chain, after data is finalized)
	BattleControllerChain.prototype.getChain = function() {
		return this.chain;
	}
	//replaces data of the most recently added but unresolved item on the chain
	//with its finalized getResolveData() data
	//
	//called by BattleController.doEvokingStage/doActionStage()
	//finds the most recently added data (whose action is_resolved = false), removes it
	//and runs this.finalizeData(action.getResolveData(unit))
	//if everything on the chain is resolved, wipe it and short_term
	BattleControllerChain.prototype.resolveChain = function() {
		var can_clear = true;
		for (var i = this.chain.length - 1; i >= 0; i--) {
			var mr_data = this.chain[i];
			var mr_action_id = this.chain[i].action_unique_id;
			var mr_unit_id = this.chain[i].unit_unique_id;
			var mr_action = this.bc.getTokenByUniqueId(mr_action_id);
			var mr_unit = this.bc.getTokenByUniqueId(mr_unit_id);
			var can_resolve;
			var is_prep_counter = (
				(mr_data.action_type == this.bc.TYPE.COUNTER) && 
				(mr_data.action_effect_type == this.EFFECT.USE)
			);
			if ((mr_data.action_effect_type == this.EFFECT.NORMAL_SUMMON) && (!(mr_unit.is_resolved) && (mr_unit.can_resolve))) {
				can_clear = false;
				this.prepareResolveSummon(mr_unit, mr_data.summon_location);
				return true;
			}
			else if ((mr_data.action_effect_type == this.EFFECT.SPECIAL_SUMMON) && (!(mr_unit.is_resolved) && (mr_unit.can_resolve))) {
				can_clear = false;
				this.prepareResolveSummon(mr_unit, mr_data.summon_location);
				return true;
			}
			if (mr_data.action_type != this.bc.TYPE.UNIT) {				
				if (!(is_prep_counter)) {
					can_resolve = mr_action.canResolve(mr_unit)
				}
				if (!(mr_action.is_resolved) && (can_resolve)) {
					can_clear = false;
					this.prepareResolve(mr_action, mr_unit);
					return true;
				}
				else if (!(mr_action.is_resolved) && !(mr_action.resolve_failed) && !(can_resolve) && !(is_prep_counter)) {
					mr_action.resolve_failed = true;
					console.log(mr_action.name + " could not resolve!");
					this.bc.awaitInputCounter(mr_action.owner);
					return false;
				} 
				else if (is_prep_counter) {
					can_clear = true;
				} 
				else {

				}
			}
		}
		if (can_clear) {
			this.chain = [];
			this.short_term = {};
			if (this.bc.getBattleStage() == "Action") this.bc.doActionStage();
			else if (this.bc.getBattleStage() == "Evoking") this.bc.doEvokingStage();
			var chain_gui = this.bc.gui.chainPane;
			chain_gui.removeChain();
		}
	}
	//makes red/blue unwilling to respond to actions on the chain
	//called by red/blue dismissing the counter activation menu
	BattleControllerChain.prototype.makeDone = function(red_blue) {
		if (red_blue == "red") this.bc.red_done = true;
		else if (red_blue == "blue") this.bc.blue_done = true;
	}
	BattleControllerChain.prototype.getTriggeredCounters = function(red_blue_both) {
		if (red_blue_both == "both") {
			var both = this.getTriggeredCounters("red").concat(this.getTriggeredCounters("blue"));
			return both;
		} else {
			var t_counters = [];
			var red_blue = red_blue_both;
			var units = this.bc.getActiveUnits(red_blue, true);
			for (var i = 0; i < units.length; i++) {
				var unit = units[i];
				for (var j = 0; j < unit.counters.length; j++) {
					var counter = unit.counters[j];
					if (counter.canActivate(unit) && counter.canTrigger(unit)) {
						t_counters.push(counter);
					}
				}
			}
			return t_counters;	
		}
	}
	BattleControllerChain.prototype.getCounterUnit = function(red_blue, action) {
		var counters = [];
		var units = this.bc.getActiveUnits(red_blue, true);
		for (var i = 0; i < units.length; i++) {
			var unit = units[i];
			for (var j = 0; j < unit.counters.length; j++) {
				var counter = unit.counters[j];
				if (counter == action) {
					return unit;
				}
			}
		}
		return null;		
	}	
	BattleControllerChain.prototype.getPossibleTargets = function(target, owner) {
		var side;
		var list;
		if (target == this.TARGET.OPPONENT_ALL) {
			if (owner == "red") side = "blue";
			else if (owner == "blue") side = "red"
			else console.log("invalid owner");

			list = this.bc.getActiveUnits(side, true);
			if ((list.length == 0) && (this.bc.turn_number != 0)) {
				list.push(this.bc.getPlayer(side));
			}
			return list;
		}
		else if (target == this.TARGET.OPPONENT_UNITS) {
			if (owner == "red") side = "blue";
			else if (owner == "blue") side = "red"
			else console.log("invalid owner");

			list = this.bc.getActiveUnits(side, false);
			if ((list.length == 0) && (this.bc.turn_number != 0)) {
				list.push(this.bc.getPlayer(side));
			}
			return list;			
		}
		else if (target == this.TARGET.OPPONENT_MINIONS) {
			if (owner == "red") side = "blue";
			else if (owner == "blue") side = "red"
			else console.log("invalid owner");

			list_all = this.bc.getActiveUnits(side, true);
			list_minions = []
			for (var i = 0; i < list_all.length; i++) {
				if (list_all[i].is_minion) list_minions.push(list_all[i]);
			}
			return list_minions;			
		}
		if (target == this.TARGET.OWNER_ALL) {
			side = owner;

			list = this.bc.getActiveUnits(side, true);
			if ((list.length == 0) && (this.bc.turn_number != 0)) {
				list.push(this.bc.getPlayer(side));
			}
			return list;
		}
		else if (target == this.TARGET.OWNER_UNITS) {
			side = owner;

			list = this.bc.getActiveUnits(side, false);
			if ((list.length == 0) && (this.bc.turn_number != 0)) {
				list.push(this.bc.getPlayer(side));
			}
			return list;			
		}
		else if (target == this.TARGET.OWNER_MINIONS) {
			side = owner;

			list_all = this.bc.getActiveUnits(side, true);
			list_minions = []
			for (var i = 0; i < list_all.length; i++) {
				if (list_all[i].is_minion) list_minions.push(list_all[i]);
			}
			return list_minions;			
		}
		return [];
	}
	window.BattleControllerChain = BattleControllerChain;
} (window));