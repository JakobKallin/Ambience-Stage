'use strict';

var ambience = function(outside) {
	var updateFade = function() {};
	var updateSound = function() {};
	var updatePrevious = function() {};
	
	function startScene(items, fade) {
		updatePrevious = stopScene(fade, outside);
		
		items.forEach(function(item) {
			if ( item.type === 'image' ) {
				startImage(item);
			}
			else if ( item.type === 'sound' ) {
				updateSound = startSound(item);
			}
			else {
				throw new Error('Unrecognized media type: "' + item.type + '".');
			}
		});
		
		function startImage(image) {
			outside.start.image(image);
		}
		
		function startSound(sound) {
			var loop = 'loop' in sound ? sound.loop : true;
			var shuffle = 'shuffle' in sound ? sound.shuffle : true;
			var overlap = sound.overlap || 0;
			var startTrack = outside.start.track;
			var shuffleArray = outside.shuffle || function(x) { return x; };
			
			var tracks = sound.tracks.slice();
			if ( sound.tracks.length === 0 ) {
				throw new Error('Cannot start sound without tracks.');
			} 
			if ( shuffle ) {
				tracks = shuffleArray(tracks);
			}
			
			var trackElapsed = 0;
			var trackDuration = function() { return 0; };
			var index = -1;
			
			return function updateSound(increase) {
				trackElapsed += increase;
				if ( trackElapsed >= trackDuration() - overlap ) {
					if ( (index + 1) in tracks ) {
						index += 1;
						trackDuration = outside.start.track(tracks[index]);
						trackElapsed = 0;
					}
					else if ( loop ) {
						index = -1;
						if ( shuffle ) {
							tracks = shuffleArray(tracks);
						}
						updateSound(increase);
					}
				}
			};
		}
		
		var fadeTime = 0;
		updateFade = function(increase) {
			fadeTime += increase;
			var ratio = fadeRatio(fadeTime, fade);
			if ( typeof ratio !== 'number' || isNaN(ratio) ) {
				throw new Error('Fade ratio was incorrectly computed as NaN.');
			}
			else {
				outside.fade.in(ratio);
			}
		}
	}
	
	function stopScene(fade) {
		outside.stop.image();
		
		var fadeTime = 0;
		return function update(increase) {
			fadeTime += increase;
			var ratio = 1 - fadeRatio(fadeTime, fade);
			outside.fade.out(ratio);
		};
	}
	
	function fadeRatio(progress, ceiling) {
		if ( ceiling === 0 ) {
			return 1;
		}
		else {
			var ratio = progress / ceiling;
			var boundedRatio = Math.min(Math.max(ratio, 0), 1)
			return boundedRatio;
		}
	}
	
	function start(items, fade) {
		fade = fade || 0;
		startScene(items, fade);
		
		return {
			start: start,
			update: update
		};
	}
	
	function update(increase) {
		updateFade(increase);
		updateSound(increase);
		updatePrevious(increase);
	}
	
	return {
		start: start,
		update: update
	};
};
