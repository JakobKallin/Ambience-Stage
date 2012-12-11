var Ambience = {};

Ambience.Stage = function(node) {
	var fadeOutDuration;
	var fade = null;
	var isFadingOut = false;
	
	var includeInFade = function(object, property, startValue, endValue) {
		if ( isFadingOut ) {
			fade.track(object, property, endValue, startValue);			
		} else {
			fade.track(object, property, startValue, endValue);			
		}
	};
	
	var removeFromFade = function(object) {
		var matchingTarget = fade.targets.first(function(target) {
			return target.object === object;
		});
		fade.targets.remove(matchingTarget);
	};
	
	var mediaPlayers = {
		'background': new Ambience.Background(node),
		'image': new Ambience.Image(node),
		'sounds': new Ambience.SoundList(node, stopSceneIfSoundOnly, includeInFade, removeFromFade),
		'text': new Ambience.Text(node)
	};
	
	var playingMedia = [];
	
	stop();
	
	function stop() {
		for ( var mediaType in mediaPlayers ) {
			if ( playingMedia.contains(mediaType) ) {
				mediaPlayers[mediaType].stop();
				playingMedia.remove(mediaType);
			}
		}
		
		stopFade();
		
		node.style.visibility = 'hidden';
		node.style.opacity = 0;
		fadeOutDuration = 0;
	}
	
	function stopSceneIfSoundOnly() {
		// The 2 below is because there might be a background color as well.
		if ( playingMedia.contains('sounds') && playingMedia.length <= 2 ) {
			stop();
		}
	}
	
	function play(scene) {
		var alreadyPlaying = playingMedia.length > 0;
		if ( alreadyPlaying && scene.isMixin ) {
			playMixin(scene);
		} else {
			playRegularScene(scene);
		}
	}
	
	function playRegularScene(scene) {
		stop();
		
		fadeOutDuration = scene.fadeOutDuration;
		playFadeIn(scene);
		
		for ( var mediaType in mediaPlayers ) {
			if ( scene[mediaType] ) {
				mediaPlayers[mediaType].play(scene);
				playingMedia.push(mediaType);
			}
		}
	}
	
	function playMixin(mixin) {
		if ( mixin.isVisual ) {
			node.style.visibility = 'visible';
		}
		
		for ( var mediaType in mediaPlayers ) {
			if ( playingMedia.contains(mediaType) && mixin[mediaType] ) {
				mediaPlayers[mediaType].stop();
				playingMedia.remove(mediaType);
			}
		}
		
		for ( var mediaType in mediaPlayers ) {
			if ( mixin[mediaType] ) {
				mediaPlayers[mediaType].play(mixin);
				playingMedia.push(mediaType);
			}
		}
	}
	
	function playFadeIn(scene) {
		if ( scene.isVisual ) {
			node.style.visibility = 'visible';
		}
		
		var targets = (fade) ? fade.targets : undefined;
		fade = new Manymation.Animation(scene.fadeInDuration, undefined, targets);
		includeInFade(node.style, 'opacity', 0, 0.999)
		fade.start();
	}
	
	function stopFade() {
		isFadingOut = false;
		if ( fade ) {
			fade.complete();
			fade = null;
		}
	}
	
	function fadeOut() {
		if ( isFadingOut ) {
			stop();
		} else {
			isFadingOut = true;
			
			fade.complete();
			reverseTargets(fade.targets);
			fade = new Manymation.Animation(fadeOutDuration, stop, fade.targets);
			fade.start();
		}
	}
	
	function reverseTargets(targets) {
		targets.forEach(function(target) {
			var start = target.startValue;
			var end = target.endValue;
			target.startValue = end;
			target.endValue = start;
		});
	}
	
	return {
		play: play,
		stop: stop,
		fadeOut: fadeOut,
		get sceneIsPlaying() {
			return playingMedia.length > 0;
		}
	};
};