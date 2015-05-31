'use strict';

var ambience = function(outside) {
	function start(items, fade) {
		fade = fade || 0;
		
		var handles = items.map(startItem);
		
		function startItem(item) {
			if ( item.type === 'image' ) {
				return startImage(item);	
			}
			else if ( item.type === 'sound' ) {
				return startSound(item);
			}
			else {
				throw new Error('Unsupported media type: ' + item.type + '.');
			}
		}
		
		function startImage(image) {
			var stop = outside.start.image(image);
			return {
			    update: nothing,
				stop: stop
			};
		}
		
		function startSound(sound) {
			var loop = 'loop' in sound ? sound.loop : true;
			var shuffle = 'shuffle' in sound ? sound.shuffle : true;
			var overlap = sound.overlap || 0;
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
			var trackIndex = -1;
			
			var update = function(increase) {
				trackElapsed += increase;
				if ( trackElapsed >= trackDuration() - overlap ) {
					if ( (trackIndex + 1) in tracks ) {
						trackIndex += 1;
						trackDuration = outside.start.track(tracks[trackIndex]).duration;
						trackElapsed = 0;
					}
					else if ( loop ) {
						trackIndex = -1;
						if ( shuffle ) {
							tracks = shuffleArray(tracks);
						}
						update(increase);
					}
				}
			};
			
		    return {
				update: update,
				stop: nothing
			};
		}
		
		function update(increase) {
			updateFade(increase);
			handles.forEach(function(handle) {
			    handle.update(increase);
			});
		};
		
		var fadeElapsed = 0;
		function updateFade(increase) {
			fadeElapsed += increase;
			var ratio = fadeRatio(fadeElapsed, fade);
			if ( typeof ratio !== 'number' || isNaN(ratio) ) {
				throw new Error('Fade ratio was incorrectly computed as NaN.');
			}
			else {
				outside.fade.in(ratio);
				outside.fade.out(1 - ratio);
			}
		};
		
		function stop() {
		    handles.forEach(function(handle) {
		        handle.stop();
		    });
		}
		
		return {
			start: function(items, fade) {
			    stop();
				return start(items, fade);
			},
			update: update
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
	
	function nothing() {}
	
	return {
		start: start
	};
};
