(function (window) {
	var BattleStage = function(){
		this.initialize();
		var unit_spacing_x = 50;
		var unit_spacing_y = 25;
		this.DIRECTION_PANE_STATE = {
			RPS: {value: 0},
			TARGET: {value: 0},
			EVOKE: {value: 0},
			COUNTER: {value: 0},
			INACTIVE: {value: 0},
		}
		this.ACTION_PANE_STATE = {
			HAND: {value: 0},
			COUNTER: {value: 0},
			TARGET: {value: 0},
			EVOKING: {value: 0},
			RPS: {value: 0},
		}
		this.LOCATION = {
			A: {
				BLUE: {
					x: 265, 
					y: 130, 
					occupied: false,
				},
				RED: {
					x: 535, 
					y: 130,
					occupied: false,
				},
			},
			B: {
				BLUE: {
					x: 265 - unit_spacing_x*1, 
					y: 130 + unit_spacing_y*1, 
					occupied: false,
				},
				RED: {
					x: 535 + unit_spacing_x*1, 
					y: 130 + unit_spacing_y*1,
					occupied: false,
				}
			},
			C: {
				BLUE: {
					x: 265 - unit_spacing_x*2, 
					y: 130 + unit_spacing_y*2, 
					occupied: false,
				},
				RED: {
					x: 535 + unit_spacing_x*2, 
					y: 130 + unit_spacing_y*2,
					occupied: false,
				}
			},
			D: {
				BLUE: {
					x: 265 - unit_spacing_x*3, 
					y: 130 + unit_spacing_y*3, 
					occupied: false,
				},
				RED: {
					x: 535 + unit_spacing_x*3, 
					y: 130 + unit_spacing_y*3,
					occupied: false,
				}
			},
			E: {
				BLUE: {
					x: 265 - unit_spacing_x*4,
					y: 130 + unit_spacing_y*4,
					occupied: false,
				},
				RED: {
					x: 535 + unit_spacing_x*4, 
					y: 130 + unit_spacing_y*4,
					occupied: false,
				}
			},
			NONE: {value: 0},
		}
		this.CURRENT_DIRECTION_STATE = this.DIRECTION_PANE_STATE.INACTIVE;
		this.CURRENT_ACTION_STATE = this.ACTION_PANE_STATE.ACTION;
	}
	var t = BattleStage.prototype = new createjs.Container();
	t.Container_initialize = t.initialize;
	t.initialize = function(){
		this.Container_initialize();
		this.curtainContainer = new createjs.Container();
		this.directionPane = new createjs.Container();
		this.actionPane = new createjs.Container();
		this.actionPaneActive = new createjs.Container();
		this.actionPaneButton = new createjs.Container();
		this.actionPaneBkgd = new createjs.Container();
		this.fieldPane = new createjs.Container();
		this.infoPane = new createjs.Container();
		this.infoPaneBkgd = new createjs.Container();
		this.infoPaneActive = new createjs.Container();
		this.infoPaneButtons = new createjs.Container();
		this.playerSwirlPane = new createjs.Container();
		this.npcSwirlPane = new createjs.Container();
		this.chainPane = new BattleChainGui();

		this.actionPane.y = 232;
		this.directionPane.y = 3;
		this.infoPane.y = this.actionPane.y + 44;

		this.addChild(this.fieldPane);
		this.addChild(this.infoPane);
		this.infoPane.addChild(this.infoPaneBkgd);
		this.infoPane.addChild(this.infoPaneActive);
		this.infoPane.addChild(this.infoPaneButtons);
		this.addChild(this.actionPane);
		this.actionPane.addChild(this.actionPaneBkgd);
		this.actionPane.addChild(this.actionPaneActive);
		this.actionPane.addChild(this.actionPaneButton);
		this.addChild(this.playerSwirlPane);
		this.addChild(this.npcSwirlPane);
		this.addChild(this.chainPane);
		this.addChild(this.directionPane);
		this.addChild(this.curtainContainer);

		this.ghosts = [];
		this.current_gui_hand = [];
	}
	//show the potential summoning locations for a unit by placing ghosts
	BattleStage.prototype.makeSummoningGhosts = function(owner, bcunit) {
		this.ghosts = [];
		if (owner == "blue") {
			var locs = level.activebattle.battleController.getAvailableLocations(owner);
			for (var i = 0; i < locs.length; i++) {
				var ghost = new BattleUnitGhost(owner, bcunit, locs[i]);
				ghost.x = locs[i].BLUE.x;
				ghost.y = locs[i].BLUE.y; 
				this.fieldPane.addChild(ghost);
				ghost.markerOn();
				ghost.greyOut();
				this.ghosts.push(ghost);
			}
		}
	}
	BattleStage.prototype.getSummoningGhosts = function(owner) {
		return this.ghosts;
	}
	BattleStage.prototype.removeSummoningGhosts = function() {
		for (var i = this.ghosts.length - 1; i >= 0; i--) {
			this.fieldPane.removeChild(this.ghosts[i]);
		}
	}
	BattleStage.prototype.changeDisplay = function(player, npc) {
		this.setUpFieldPane(player, npc);
		this.setUpDirectionPane();
		this.setUpActionPane();
		this.setUpInfoPane();
		this.playerSwirl = new BattleInfoSwirl(this.bc, player.bcunit);
		this.npcSwirl = new BattleInfoSwirl(this.bc, npc.bcunit);
		this.playerSwirlPane.addChild(this.playerSwirl);
		this.npcSwirlPane.addChild(this.npcSwirl);
	}
	BattleStage.prototype.fadeToBlack = function() {
		var color = '#000000'
		var curtain = new createjs.Shape();
		curtain.graphics.beginFill(color).drawRect(0, 0, canvas.width, canvas.height);
		curtain.alpha = 0;
		this.curtain = curtain;
		this.curtainContainer.addChild(this.curtain);	
		createjs.Tween.get(this.curtain).to({alpha:1},1000).call(
			function() {
				var thisStage = level.activebattle.battleStage;
				thisStage.fadeIn();
			}
		);

	}
	BattleStage.prototype.fadeIn = function() {
		level.activebattle.changeDisplay();
		createjs.Tween.get(this.curtain).to({alpha:0},1000).call(
			function() {
				var thisStage = level.activebattle.battleStage;
				thisStage.curtainContainer.removeChild(this.curtain);
				level.activebattle.encounterStart();
			}
		);
	}
	BattleStage.prototype.endBattle = function() {
		var color = '#000000'
		var curtain = new createjs.Shape();
		curtain.graphics.beginFill(color).drawRect(0, 0, canvas.width, canvas.height);
		curtain.alpha = 0;
		this.curtain = curtain;
		this.curtainContainer.addChild(this.curtain);
		bstage = this;
		createjs.Tween.get(bstage.curtain).to({alpha:1},1000).call(
			function() {	
				bstage.removeChild(bstage.fieldPane);
				bstage.removeChild(bstage.infoPane);
				bstage.removeChild(bstage.actionPane);
				bstage.removeChild(bstage.playerSwirlPane);
				bstage.removeChild(bstage.npcSwirlPane);
				bstage.removeChild(bstage.chainPane);
				bstage.removeChild(bstage.directionPane);
				level.activebattle.battleController.endBattle();
				createjs.Tween.get(bstage.curtain).to({alpha:0},1000).call(
					function() {
						bstage.removeAllChildren();
						level.activebattle.battleStage = null;
						level.activebattle.battleController = null;
						level.activebattle = null;
					}
				);
			}
		);

	}
	BattleStage.prototype.fadeIn = function() {
		level.activebattle.changeDisplay();
		createjs.Tween.get(this.curtain).to({alpha:0},1000).call(
			function() {
				var thisStage = level.activebattle.battleStage;
				thisStage.curtainContainer.removeChild(this.curtain);
				level.activebattle.encounterStart();
			}
		);
	}
	BattleStage.prototype.setUpDirectionPane = function() {
		var message = level.activebattle.initiator.formalname + " wants to fight!"
		this.newDirectionPane(message, false);
	}
	BattleStage.prototype.setUpActionPane = function() {
		//var color = '#FFFFFF'
		//var bordercolor = '#000000'
		//var paneBodyBox = new createjs.Shape();
		//paneBodyBox.graphics.beginStroke(bordercolor);
		//paneBodyBox.graphics.setStrokeStyle(2);
		//paneBodyBox.graphics.beginFill(color).drawRect(0, 0, canvas.width, 36);
		//this.actionPaneBkgd.addChild(paneBodyBox);

		var buttonContainer = this.buildRockPaperScissors();
		buttonContainer.y -= 36;
		this.actionPaneActive.addChild(buttonContainer);
	}
	BattleStage.prototype.setUpInfoPane = function() {
		var color = '#FFFFFF'
		var bordercolor = '#000000'
		var paneBodyBox = new createjs.Shape();
		paneBodyBox.graphics.beginStroke(bordercolor);
		paneBodyBox.graphics.setStrokeStyle(2);
		paneBodyBox.graphics.beginFill(color).drawRect(0, 0, canvas.width, 200);
		this.infoPaneBkgd.addChild(paneBodyBox);
	}
	BattleStage.prototype.setUpFieldPane = function(player, npc) {
		var background = new createjs.Bitmap(loader.getResult("battlebkgd1"));
		this.fieldPane.addChild(background);
		this.fieldPane.addChild(npc);
		this.fieldPane.addChild(player);
	}
	BattleStage.prototype.newDirectionPane = function(message, do_tween) {
		this.directionPane.removeAllChildren();
		var paneHead = new createjs.Container();
		// Create the title text to be displayed
		var mcontainer = new createjs.Container();
		for (var i = 0; i < 16; i++) {
			var message1 = new createjs.Text(message, "26px crazycreation", "#000000");			
			var color = "#FFFFFF";
			message1.shadow = new createjs.Shadow(color, 0, 0, 4);
			mcontainer.addChild(message1)
		}
		var bounds = mcontainer.getBounds();
		mcontainer.cache(bounds.x - 80, bounds.y, bounds.width + 80, bounds.height + 80)
		var message2 = new createjs.Text(message, "26px crazycreation", "#000000");
		mcontainer.addChild(message2)
		paneHead.addChild(mcontainer);
		var goalX = canvas.width/2 - paneHead.getBounds().width/2 + 40;
		if (do_tween) {
			paneHead.x = goalX + 25;
			createjs.Tween.get(paneHead).to({x:goalX},500);		
		} else {
			paneHead.x = goalX;
		}	
		this.directionPane.addChild(paneHead);
	}
	BattleStage.prototype.updateActionPane = function() {
		if (this.CURRENT_ACTION_STATE == this.ACTION_PANE_STATE.EVOKING) this.newActionPaneEvoking();
		else if (this.CURRENT_ACTION_STATE == this.ACTION_PANE_STATE.HAND) this.newActionPaneHand();
		else if (this.CURRENT_ACTION_STATE == this.ACTION_PANE_STATE.TARGET) this.newActionPaneTarget();
		else if (this.CURRENT_ACTION_STATE == this.ACTION_PANE_STATE.COUNTER) this.newActionPaneCounter();
	}
	BattleStage.prototype.newActionPaneEvoking = function() {
		this.CURRENT_ACTION_STATE = this.ACTION_PANE_STATE.EVOKING;
		this.actionPane.removeChild(this.actionPaneActive);
		this.actionPane.removeChild(this.actionPaneButton);
		this.actionPaneActive = this.buildEvokePane();
		this.actionPaneActive.y -= 36;
		this.actionPane.addChild(this.actionPaneActive);

		if ((this.bc.turnPlayer == "blue") && (this.bc.getBattleStage() == "Evoking") && !(this.bc.is_resolving)) {
			var continueButton = new BattleButton(true, "continue")
			continueButton.x = 700;
			continueButton.y = -18;
			this.actionPaneButton = continueButton;
			this.actionPane.addChild(this.actionPaneButton);
		}
	}
	BattleStage.prototype.newActionPaneHand = function(draw) {
		this.CURRENT_ACTION_STATE = this.ACTION_PANE_STATE.HAND;
		this.actionPane.removeChild(this.actionPaneActive);
		this.actionPane.removeChild(this.actionPaneButton);
		this.actionPaneActive = this.buildHandPane();
		this.actionPaneActive.y -= 36;
		if (draw) {
			this.actionPaneActive.x -= canvas.width;
			createjs.Tween.get(this.actionPaneActive).to({x: this.actionPaneActive.x + canvas.width},500).call(
				function() {
					
				}
			);
		}
		this.actionPane.addChild(this.actionPaneActive);

		if ((this.bc.turnPlayer == "blue") && (this.bc.getBattleStage() == "Action")) {
			if ((this.bc.chain.chain.length == 0) && !(this.bc.is_resolving)){
				var continueButton = new BattleButton(true, "continue")
				continueButton.x = 700;
				continueButton.y = -18;
				this.actionPaneButton = continueButton;
				this.actionPane.addChild(this.actionPaneButton);
			}
		}		
	}
	BattleStage.prototype.returnHand = function() {
		for (var i = 0; i < this.current_gui_hand.length; i++) {
			this.returnCard(this.current_gui_hand[i]);
		}
	}
	BattleStage.prototype.returnCard = function(card_button) {
		var g = this;
		createjs.Tween.get(card_button).to({x: card_button.x - canvas.width},500).call(
			function() {
				
			}
		);
	}
	BattleStage.prototype.drawHand = function() {
		this.newActionPaneHand(true)
	}
	//called by bc.awaitInputTarget() when some data requires player to select a target
	//this function generates the buttons that:
	// 1) save a target's unique_id to a memory
	// 2) call chain.finalizeData(), which attempts to collect the inputs saved to memory
	//    if it doesnt have input for every target it needs, it calls newActionPaneTarget again 
	//
	//tag: "target_a", "target_b", etc.
	//spec: this.bc.chain.TARGET.OPPONENT_ALL
	//data: the data that must be finalized before it can be added to chain
	BattleStage.prototype.newActionPaneTarget = function(memory_id, range, data) {
		this.CURRENT_ACTION_STATE = this.ACTION_PANE_STATE.TARGET;
		var action_id = data.action_unique_id;		
		var action = this.bc.getTokenByUniqueId(action_id);
		this.newDirectionPane("Select a Target for " + action.name, true);
		this.actionPane.removeChild(this.actionPaneActive);
		this.actionPane.removeChild(this.actionPaneButton);
		this.actionPaneActive = this.buildTargetPane(memory_id, range, data);
		this.actionPaneActive.y -= 36;
		this.actionPane.addChild(this.actionPaneActive);
	}
	BattleStage.prototype.newActionPaneCounter = function() {
		this.CURRENT_ACTION_STATE = this.ACTION_PANE_STATE.COUNTER;
		this.newDirectionPane("Activate a Counter", true);
		this.actionPane.removeChild(this.actionPaneActive);
		this.actionPane.removeChild(this.actionPaneButton);
		this.actionPaneActive = this.buildCounterPane();
		this.actionPaneActive.y -= 36;
		this.actionPane.addChild(this.actionPaneActive);
	}
	BattleStage.prototype.newInfoPane = function(type, obj) {
		if (type == "unit_info") {
			this.infoPane.removeChild(this.infoPaneActive);
			this.infoPane.removeChild(this.infoPaneButton);
			this.infoPaneActive = this.buildUnitStatsPane(obj);
			this.infoPane.addChild(this.infoPaneActive);
		}
		else if (type == "action_hand_info") {
			this.infoPane.removeChild(this.infoPaneActive);
			this.infoPane.removeChild(this.infoPaneButton);
			this.infoPaneActive = this.buildActionInfoPane(obj);
			this.infoPane.addChild(this.infoPaneActive);
		} else {
			throw "ERROR: " + type + " is not a valid infoPane type."
		}
	}
	BattleStage.prototype.buildRockPaperScissors = function() {
		var buttonContainer = new createjs.Container();
		var buttons = [];
		buttons.push(new BattleButton(true, "rock"));
		buttons.push(new BattleButton(true, "paper"));
		buttons.push(new BattleButton(true, "scissors"));
		for (var i = 0; i < buttons.length; i++) {
			var bcWidth = 0;
			var currentButton = buttons[i];
			if (buttonContainer.getBounds() != null) bcWidth = buttonContainer.getBounds().width + 8;
			currentButton.x = bcWidth;
			buttonContainer.addChild(currentButton);
		}
		buttonContainer.x = canvas.width/2 - buttonContainer.getBounds().width/2;
		return buttonContainer;
	}
	BattleStage.prototype.buildUnitStatsPane = function(unit) {
		var masterContainer = new createjs.Container();
		var uniticon = new BattleButton(true, "unit_token", unit);
		uniticon.x += 4;
		uniticon.y -= 8;

		var thumbnailbox = new createjs.Container();
		// Create the title text to be displayed
		var message = unit.name + " " + unit.title;
		nametext = new createjs.Text(message, "32px crazycreation", "#000000");
		nametext.x = uniticon.x + uniticon.getBounds().width + 8;
		var message2 = "";
		for (var i = 0; i < unit.attributes.length; i++) {
			message2 = message2 + unit.attributes[i].string;
			if (i != unit.attributes.length - 1) {
				message2 = message2 + ", "
			}
		}
		attributetext = new createjs.Text(message2, "26px crazycreation", "#000000");
		attributetext.x = uniticon.x + uniticon.getBounds().width + 8;
		attributetext.y = nametext.y + nametext.getBounds().height;
		thumbnailbox.addChild(nametext);
		thumbnailbox.addChild(attributetext);
		thumbnailbox.y = (uniticon.getBounds().height)/2 - thumbnailbox.getBounds().height/2
		thumbnailbox.addChild(uniticon);
		var center_factor = 4;
		if (unit.attributes.length > 2) center_factor = 3;
		thumbnailbox.x = canvas.width/2 - canvas.width/center_factor;
		masterContainer.addChild(thumbnailbox);

		var health = new BattleStat(unit, "health");
		var attack = new BattleStat(unit, "attack");
		var defense = new BattleStat(unit, "defense");
		var statbox = new createjs.Container();
		attack.x = health.x + health.getBounds().width;
		defense.x = attack.x + attack.getBounds().width;
		statbox.addChild(health);
		statbox.addChild(attack);
		statbox.addChild(defense);
		statbox.x = canvas.width/2 - statbox.getBounds().width/2;
		statbox.y = thumbnailbox.y + thumbnailbox.getBounds().height;
		masterContainer.addChild(statbox);

		return masterContainer;
	}
	BattleStage.prototype.buildActionInfoPane = function(action) {
		var masterContainer = new createjs.Container();
		var actionicon = new BattleButton(true, "action_info", action);
		actionicon.x += 4;
		actionicon.y -= 8;

		var thumbnailbox = new createjs.Container();
		var message = action.name;
		var nametext = new createjs.Text(message, "32px crazycreation", "#000000");
		nametext.x = actionicon.x + actionicon.getBounds().width + 8;

		var attr_collected_text = action.attributes[0].string;
		for (var i = 1; i < action.attributes.length; i++) {
			attr_collected_text += (" / " + action.attributes[i])
		}
		var message2 = attr_collected_text + " " + action.type.string;
		attributetext = new createjs.Text(message2, "26px crazycreation", "#000000");
		attributetext.x = actionicon.x + actionicon.getBounds().width + 8;
		attributetext.y = nametext.y + nametext.getBounds().height;

		var manabox = new createjs.Container();
		for (var i = 0; i < action.cost_mana; i++) {
			var mana = new createjs.Bitmap(loader.getResult("mana"));
			mana.x = 20*i;
			manabox.addChild(mana);
		}
		manabox.x = actionicon.x + actionicon.getBounds().width + 4;
		manabox.y = attributetext.y + attributetext.getBounds().height + 4;
		thumbnailbox.addChild(nametext);
		thumbnailbox.addChild(attributetext);
		thumbnailbox.addChild(manabox);
		thumbnailbox.x = canvas.width/2 - canvas.width/4;
		//if this token doesn't have mana, we must remove the y offset
		if (manabox.getBounds() != null) {
			thumbnailbox.y = (
				(actionicon.getBounds().height)/2 - 
				thumbnailbox.getBounds().height/2 + 
				(manabox.getBounds().height + 4)/2
			);			
		} else {
			thumbnailbox.y = (
				(actionicon.getBounds().height)/2 - 
				thumbnailbox.getBounds().height/2
			);			
		}
		thumbnailbox.addChild(actionicon);
		//centering objects in a pane. offset should be set at xOffset
		//text to be centered - desc;
		var desc = action.description;
		var desc1_max = desc.length; //the index of the last character that can fit
		var desc2_max = desc.length; //these values are reset later on.
		var descbox = new createjs.Container();
		var desctext1 = new createjs.Text("", "26px crazycreation", "#000000");
		var desctext2 = new createjs.Text("", "26px crazycreation", "#000000");
		var desctext3 = new createjs.Text("", "26px crazycreation", "#000000");
		descbox.addChild(desctext1);
		descbox.addChild(desctext2);
		descbox.addChild(desctext3);
		var xOffset = actionicon.x + actionicon.getBounds().width/2
		var rightEdge = canvas.width - xOffset - xOffset - xOffset - xOffset;
		descbox.x = xOffset;
		desctext1.text = desc;
		desctext2.text = "";
		desctext3.text = ""; //the text changes below
		var word_i;
		if (desctext1.getBounds().width > rightEdge) {
			desctext1.text = " ";
			var word_list = desc.split(" ");
			var num_char = 0;
			var best_size = 0;
			for (var i = 0; i < word_list.length; i++) {
				desctext1.text = desctext1.text + word_list[i]
				num_char += word_list[i].length + 1;
				var bounds = desctext1.getBounds();
				if ((bounds.width > best_size) && (bounds.width < rightEdge)) {
					best_size = num_char;
				}
				if (bounds.width > rightEdge) {
					word_i = i;
					break;
				}
			}
			desc1_max = best_size;
		}
		if (desctext1.getBounds().width > rightEdge) {
			desctext2.text = " ";
			var word_list = desc.split(" ");
			var num_char = 0;
			var best_size = 0;
			for (var i = word_i; i < word_list.length; i++) {
				desctext2.text = desctext2.text + word_list[i]
				num_char += word_list[i].length + 1;
				var bounds = desctext2.getBounds();
				if ((bounds.width > best_size) && (bounds.width < rightEdge)) {
					best_size = num_char;
				}
				if (bounds.width > rightEdge) {
					break;
				}
			}
			desc2_max = best_size + desc1_max;
		}
		if (desc.length <= desc1_max) {
			desctext1.text = desc.slice(0, desc.length);
		} 
		else if ((desc.length > desc1_max) && (desc.length <= desc2_max)){
			desctext1.text = desc.slice(0, desc1_max);
			desctext2.text = desc.slice(desc1_max, desc.length);
		} 
		else if (i > desc.length) {
			desctext1.text = desc.slice(0, desc1_max);
			desctext2.text = desc.slice(desc1_max, desc2_max);
			desctext3.text = desc.slice(desc2_max, desc.length)
		}
		var bounds1 = desctext1.getBounds();
		var bounds2 = desctext2.getBounds();
		var bounds3 = desctext3.getBounds();
		if (bounds1 != null) {
			desctext2.y = desctext1.y + desctext1.getBounds().height + 4;
		}
		if (bounds2 != null) {
			desctext3.y = desctext2.y + desctext2.getBounds().height + 4;	
		}

		if (manabox.getBounds() != null) {
			descbox.y = thumbnailbox.y + thumbnailbox.getBounds().height + 7;	
		} else {
			descbox.y = thumbnailbox.y + thumbnailbox.getBounds().height + 8;
		}
		descbox.x = canvas.width/2 - descbox.getBounds().width/2;
		masterContainer.addChild(thumbnailbox);
		masterContainer.addChild(descbox);

		return masterContainer;
	}
	BattleStage.prototype.buildEvokePane = function() {
		var buttons = [];
		var playerUnits = this.bc.getAllUnits("blue", false);
		for (var i = 0; i < playerUnits.length; i++) {
			var unit = playerUnits[i]
			if (!(unit.is_active)) buttons.push(new BattleButton(true, "unit_summon", playerUnits[i]));
		}
		var buttonContainer = new createjs.Container();
		var i = 0;
		for (i = 0; i < buttons.length; i++) {
			var bcWidth = 0;
			var currentButton = buttons[i];
			if (buttonContainer.getBounds() != null) bcWidth = buttonContainer.getBounds().width + 8;
			currentButton.x = bcWidth;
			buttonContainer.addChild(currentButton);
		}
		if (i != 0) {
			buttonContainer.x = canvas.width/2 - buttonContainer.getBounds().width/2;		
		}

		return buttonContainer;
	}
	BattleStage.prototype.buildCounterPane = function() {
		var buttons = [];
		var playerUnits = this.bc.getAllUnits("blue", false);
		var counters = this.bc.chain.getTriggeredCounters("blue");
		for (var i = 0; i < counters.length; i++) {
			buttons.push(new BattleButton(true, "counter_activate", counters[i]));
		}
		var buttonContainer = new createjs.Container();
		for (var i = 0; i < buttons.length; i++) {
			var bcWidth = 0;
			var currentButton = buttons[i];
			if (buttonContainer.getBounds() != null) bcWidth = buttonContainer.getBounds().width + 8;
			currentButton.x = bcWidth;
			buttonContainer.addChild(currentButton);
		}
		buttonContainer.x = canvas.width/2 - buttonContainer.getBounds().width/2;

		return buttonContainer;
	}
	BattleStage.prototype.buildHandPane = function() {
		var buttonContainer = new createjs.Container();
		var buttons = [];

		var hand = this.bc.getHand("blue");
		for (var i = 0; i < hand.length; i++) {
			buttons.push(new BattleButton(true, "action_hand", hand[i]));
		}
		for (var i = 0; i < buttons.length; i++) {
			var bcWidth = 0;
			var currentButton = buttons[i];
			if (buttonContainer.getBounds() != null) {
				bcWidth = buttonContainer.getBounds().width + 8;
			}
			currentButton.x = bcWidth;
			buttonContainer.addChild(currentButton);
		}
		var b = buttonContainer.getBounds();
		var offset;
		if (b != null) offset = b.width/2;
		else offset = 0;
		buttonContainer.x = canvas.width/2 - offset;
		this.current_gui_hand = buttons;
		return buttonContainer;
	}
	//buildTargetPane("one", this.bc.chain.TARGET.OPPONENT_ALL);
	BattleStage.prototype.buildTargetPane = function(memory_id, range, data) {
		var buttonContainer = new createjs.Container();
		var buttons = [];

		var targets = this.bc.chain.getPossibleTargets(range, "blue");
		for (var i = 0; i < targets.length; i++) {
			buttons.push(new BattleButton(true, "unit_target", targets[i], memory_id, data));
		}
		for (var i = 0; i < buttons.length; i++) {
			var bcWidth = 0;
			var currentButton = buttons[i];
			if (buttonContainer.getBounds() != null) {
				bcWidth = buttonContainer.getBounds().width + 8;
			}
			currentButton.x = bcWidth;
			buttonContainer.addChild(currentButton);
		}
		buttonContainer.x = canvas.width/2 - buttonContainer.getBounds().width/2;
		return buttonContainer;
	}
	BattleStage.prototype.summonToField = function(bcunit, location) {
		if (!bcunit.is_player) {
			var guiUnit = bcunit.guiUnit;
			guiUnit.setLocation(location);
			this.fieldPane.addChild(guiUnit);
		} else {
			bcunit.stepForward(location);
		}
	}
	/*
	BattleStage.prototype.revoke = function(bcunit) {
		var unit = bcunit.guiUnit;
		unit.spot = this.SPOT.NONE;
		this.fieldPane.removeChild(unit);
		this.rearrangeUnits(bcunit.owner);
	}
	*/
	BattleStage.prototype.tick = function() {
		this.fieldPane.sortChildren(sortFunction);
	}
	window.BattleStage = BattleStage;
} (window));		
