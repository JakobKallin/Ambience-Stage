'use strict';

var ambience = function(outside) {
	function startScene(items, fade) {
		var updatePrevious = stopScene(fade, outside);
		
		items.forEach(function(item) {
			if ( item.type === 'image' ) {
				startImage(item);
			}
			else if ( item.type === 'sound' ) {
				return;
				startSound(item);
			}
			else {
				throw new Error('Unrecognized media type: "' + item.type + '".');
			}
		});
		
		function startImage(image) {
			outside.start.image(image);
		}
		
		function startSound(sound) {
			var tracks = sound.tracks.slice();
			var loop = 'loop' in sound ? sound.loop : true;
			var shuffle = 'shuffle' in sound ? sound.shuffle : true;
			var overlap = sound.overlap || 0;
			var audio = outside.audio;
			var shuffleArray = outside.shuffle || function(x) { return x; };
			
			if ( sound.tracks.length === 0 ) {
				throw new Error('Cannot start sound without tracks.');
			} 
			
			if ( shuffle ) {
				tracks = shuffleArray(tracks);
			}
			
			var tick = createTicker();
			var current = {
				index: 0,
				audio: audio.start(tracks[0], tick),
				tick: tick
			};
			
			return tick;
			
			function createTicker() {
				return function tick(seconds) {
					if ( current.tick !== tick ) {
						return;
					}
					
					if ( seconds >= current.audio.duration() - overlap ) {
						var nextIndex = null;
						
						if ( (current.index + 1) in tracks ) {
							nextIndex = current.index + 1;
						}
						else if ( loop ) {
							nextIndex = 0;
							if ( shuffle ) {
								tracks = shuffleArray(tracks);
							}
						}
						
						if ( nextIndex !== null ) {
							current.tick = createTicker();
							current.index = nextIndex;
							current.audio = audio.start(tracks[nextIndex], current.tick);
						}
					}
				}
			}
		}
		
		return function update(progress) {
			var ratio = updateRatio(progress, fade);
			outside.fade.in(ratio);
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
