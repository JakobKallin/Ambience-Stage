Ambience.SoundList = function(container, stopSceneIfSoundOnly, includeInFade, removeFromFade) {
	var scene;
	var trackIndex;
	var tracks = [];
	
	function play(newScene) {
		scene = newScene;
		
		trackIndex = -1; // -1 because the index is either incremented or randomized in the playNextTrack method.
		playNextTrack();
	}
	
	function playNextTrack() {
		// We need this so that we stop audio-only effects after they have actually played once.
		var hasPlayedBefore = trackIndex !== -1;
		
		if ( scene.soundOrder === 'random' ) {
			trackIndex = scene.sound.randomIndex();
		} else {
			trackIndex = (trackIndex + 1) % scene.sound.length;
		}
		
		var allTracksHavePlayed = hasPlayedBefore && trackIndex === 0;
		var oneShot = !scene.loops && scene.hasOnlySound;
		
		if ( oneShot && allTracksHavePlayed ) {
			stopSceneIfSoundOnly();
		} else if ( scene.loops || !allTracksHavePlayed ) {
			var trackPath = scene.sound[trackIndex];
			var track = new Ambience.Track(trackPath, container, scene.volume, includeInFade, removeFromFade);
			var onEnded = [function() { removeTrack(track); }, playNextTrack];
			
			track.play({ onTimeUpdate: onTimeUpdate, onEnded: onEnded });
			tracks.push(track);
		}
	}
	
	function stop() {
		tracks.map(function(track) { track.stop(); });
		tracks = [];
		scene = null;
	}
	
	// Below, "this" refers to the <audio> element playing a sound.
	function onTimeUpdate() {
		// This event seems to sometimes fire after the scene has been removed, so we need to check for a scene to avoid null pointers.
		if ( scene ) {
			var duration = this.actualDuration || this.duration;
			var timeLeft = duration - this.currentTime;
			if ( timeLeft <= scene.crossoverDuration ) {
				this.removeEventListener('timeupdate', onTimeUpdate);
				this.removeEventListener('ended', playNextTrack)
				playNextTrack();
			}
		}
	}
	
	// We should remove tracks from the list once they are done, so they don't take up space.
	function removeTrack(track) {
		track.stop(); // This is important because it removes the <audio> element.
		var index = tracks.indexOf(track);
		tracks.splice(index, 1);
	}
	
	return {
		play: play,
		stop: stop
	};
};