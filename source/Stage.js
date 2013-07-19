// This file is part of Ambience Stage
// Copyright 2012-2013 Jakob Kallin
// License: GNU GPL (http://www.gnu.org/licenses/gpl-3.0.txt)

var AmbienceStage = function(stageNode) {
	var self = this;
	
	var scenePlayers = [];
	
	function stopAll() {
		scenePlayers.forEach(function(player) {
			player.stop();
		});
	}
	
	function stopAllButNewest() {
		// Note that the removal operation below is valid, since we're not removing from the sliced list.
		var playersToStop = scenePlayers.slice(0, scenePlayers.length - 1);
		playersToStop.forEach(function(player) {
			player.stop();
		});
	}
	
	self.play = function(scene) {
		stopAllButNewest();
		
		var playerToFadeOut = scenePlayers[scenePlayers.length - 1];
		if ( playerToFadeOut ) {
			playerToFadeOut.fadeOut(scene.fade.in);
		}
		
		var player = new AmbienceStage.ScenePlayer(stageNode);
		scenePlayers.push(player);
		player.play(scene).then(function() {
			scenePlayers.remove(player)
		});
	};
	
	// Note that a stage handles an "invalid" call to "mixin" as simply a call to "play" while a scene player ignores such a call entirely. Should it be consistent between the two?
	self.mixin = function(scene) {
		stopAllButNewest();
		
		if ( scenePlayers[0] ) {
			scenePlayers[0].mixin(scene);
		} else {
			self.play(scene);
		}
	};
	
	self.stop = function() {
		stopAll();
	};
	
	self.fadeOut = function() {
		stopAllButNewest();
		
		if ( scenePlayers[0] ) {
			scenePlayers[0].fadeOut();
		}
	};
	
	Object.defineProperty(self, 'sceneIsPlaying', {
		get: function() {
			// This is not valid, since players are not immediately removed after fading out.
			return scenePlayers.length > 0;
		}
	});
};