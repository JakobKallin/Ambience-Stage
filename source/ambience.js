'use strict';

var ambience = function(outside) {
	function startScene(items, fade) {
		var updatePrevious = stopScene(fade, outside);
		
		var updateSound = function() {};
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
			
			var trackStart = -Infinity;
			var trackDuration = function() { return 0; };
			var index = -1;
			
			return function updateSound(progress) {
				var trackElapsed = progress - trackStart;
				if ( trackElapsed >= trackDuration() - overlap ) {
					if ( (index + 1) in tracks ) {
						index += 1;
						trackDuration = outside.start.track(tracks[index]);
						trackStart = progress;
					}
					else if ( loop ) {
						index = -1;
						if ( shuffle ) {
							tracks = shuffleArray(tracks);
						}
						updateSound(progress);
					}
				}
			};
		}
		
		function updateFade(progress) {
			var ratio = updateRatio(progress, fade);
			outside.fade.in(ratio);
		}
		
		return function update(progress) {
			updateFade(progress);
			updateSound(progress);
			updatePrevious(progress);
		};
	}
	
	function stopScene(fade) {
		stopImage();
		
		function stopImage() {
			outside.stop.image();
		}
		
		return function update(progress) {
			var ratio = 1 - updateRatio(progress, fade);
			outside.fade.out(ratio);
		};
	}
	
	function updateRatio(progress, ceiling) {
		var ratio = progress / ceiling;
		var boundedRatio = Math.min(Math.max(ratio, 0), 1)
		return boundedRatio;
	}
	
	return {
		start: function(items) {
			var fade = arguments[1] || 0;
			
			return startScene(items, fade);
		},
		stop: function() {
			var fade = arguments[0] || 0;
			
			return stopScene(fade);
		}
	};
};
