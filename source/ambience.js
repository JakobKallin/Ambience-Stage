'use strict';

var ambience = function(outside) {
	function start(items, fade) {
		fade = fade || 0;
		
		var stopScene = 'scene' in outside.start ? outside.start.scene(updateScene) : nothing;
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
			
			return {
				update: function(increase) {
				    updateLatest(increase);
				},
				stop: nothing
			};
			
			function startTrack(index) {
				var startTime = outside.time();
				var handle = outside.start.track(tracks[index], updateScene);
				var updateNext = null;
				
				return function update() {
					var currentTime = outside.time();
					var elapsed = currentTime - startTime;
					
					if ( elapsed >= handle.duration() - overlap && !updateNext ) {
						if ( (index + 1) in tracks ) {
							updateNext = startTrack(index + 1);
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
		
		function updateScene() {
			updateFade();
			handles.forEach(function(handle) {
			    handle.update();
			});
		};
		
		var sceneStartTime = outside.time();
		function updateFade() {
			var currentTime = outside.time();
			var elapsed = currentTime - sceneStartTime;
			var ratio = fadeRatio(elapsed, fade);
			if ( typeof ratio !== 'number' || isNaN(ratio) ) {
				throw new Error('Fade ratio was incorrectly computed as NaN.');
			}
			else {
				outside.fade.in(ratio);
				outside.fade.out(1 - ratio);
			}
		};
		
		function stop() {
			stopScene();
		    handles.forEach(function(handle) {
		        handle.stop();
		    });
		}
		
		return function(items, fade) {
		    stop();
			return start(items, fade);
		};
	}
	
	function fadeRatio(progress, ceiling) {
		if ( ceiling === 0 ) {
			return 1;
		}
		else {
			var ratio = progress / ceiling;
			var boundedRatio = Math.min(Math.max(ratio, 0), 1);
			return boundedRatio;
		}
	}
	
	function nothing() {}
	
	return start;
};
