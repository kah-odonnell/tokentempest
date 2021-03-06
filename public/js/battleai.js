(function (window) {
	var BattleAI = function BattleAI(bc) {
		var evoking_satisfied = false;
		var action_satisfied = false;
		var counter_satisfied = false;
		var bc = bc;
		this.isTurn = function() {
			if (bc.turnPlayer == "red") return true;
			else if (bc.turnPlayer == "blue") return false;
			else console.log("wtf")
		}
		this.evokeRandom = function(evokable_units) {
			var num_to_add = Math.floor(Math.random() * evokable_units.length);
			var locs = bc.getAvailableLocations("red");
			var location_to_summon = Math.floor(Math.random() * locs.length);
			bc.chain.prepareSummon(evokable_units[num_to_add], locs[location_to_summon]);
		}
		this.doEvokingStageAI = function() {
			if (!this.isTurn) return false;
			if (evoking_satisfied == true) {
				bc.setBattleStage(bc.STAGE.ACTION);						
			} else {
				var evokeable = bc.getEvokeableUnits("red", false);
				if (evokeable.length > 0) {
					this.evokeRandom(evokeable);
					evoking_satisfied = true;
				} else {
					evoking_satisfied = true;
					this.doEvokingStageAI();
				}
			}
		}
		this.doActionStageAI = function() {
			if (!this.isTurn) return false;
			evoking_satisfied = false;
			var did_action = this.useAction();
			if (did_action) {
				return true;
			} 
			else if (bc.chain.chain.length == 0) {
				bc.setBattleStage(bc.STAGE.END);
				return true;
			} else {
				bc.doActionStage();
				return true;
			}
		}
		this.useAction = function() {
			var hand = bc.getHand("red")
			if (hand.length > 0) {
				var j = Math.floor(Math.random() * (hand.length))
				var action = hand[j];
				var units = bc.getActiveUnits("red", true);
				for (var i = 0; i < units.length; i++) {
					var unit = units[i];
					if (action.canUse(unit)) {
						bc.chain.prepareUse(action, unit);
						return true;
					} 
				}
			}
			return false;		
		}
		this.selectCounters = function() {
			var counters = bc.chain.getTriggeredCounters("red")
			if (counters.length > 0) {
				var j = Math.floor(Math.random() * (counters.length))
				var counter = counters[j];
				var unit = bc.chain.getCounterUnit("red", counter);
				bc.chain.prepareActivate(counter, unit);
			} else {
				bc.red_done = true;
				bc.awaitInputCounter("red");		
			}
		}
		//selectTarget(0, bc.chain.TARGET.OPPONENT_ALL, data)
		this.selectTarget = function(memory_id, range, data) {
			var user_unit_id = data.unit_unique_id;
			var action_id = data.action_unique_id;
			var targets = bc.chain.getPossibleTargets(range, "red");
			var j = Math.floor(Math.random() * (targets.length))
			var target = targets[j];
			var target_user_id = target.unique_id;
			bc.chain.short_term[action_id].select_target[memory_id] = target_user_id;
			bc.red_done = true;
			bc.chain.finalizeData(data);
		}
	}
	window.BattleAI = BattleAI;
} (window));