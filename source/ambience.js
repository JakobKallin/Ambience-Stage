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
			
			var updateLatest = startTrack(0);
			updateLatest.index = 0;
			
			return {
				update: function(increase) {
				    updateLatest(increase);
				},
				stop: nothing
			};
			
			function startTrack(index) {
				var elapsed = 0;
				var handle = outside.start.track(tracks[index]);
				var updateNext = null;
				
				return function update(increase) {
					elapsed += increase;
					if ( updateNext ) {
						updateNext(increase);
					}
					
					if ( elapsed >= handle.duration() - overlap && !updateNext ) {
						if ( (index + 1) in tracks ) {
							updateNext = startTrack(index + 1);
							updateNext.index = index + 1;
						}
						else if ( loop ) {
							if ( shuffle ) {
								tracks = shuffleArray(tracks);
							}
							updateNext = startTrack(0);
						}
					}
					
					if ( elapsed >= handle.duration() ) {
						handle.stop();
						if ( updateNext ) {
							updateLatest = updateNext;
						}
					}
				};
			}
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
