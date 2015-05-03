'use strict';

var ambience = (function() {
	var start = function start(items, stage, fade) {
		if ( !fade ) {
			fade = 0;
		}
		
		var fadeOut = stop(stage, fade);
		
		var scene = document.createElement('div');
		scene.className = 'scene';
		
		var actions = {
			image: startImage,
			sound: start.sound
		}
		
		items.forEach(function(item) {
			actions[item.type](item, scene);
		});
		
		stage.appendChild(scene);
		
		var update = function update(ms) {
			var ratio = fade === 0 ? 1 : ms / fade;
			// Note that the we don't set the opacity to exactly 1.0, because
			// that can cause some undesirable text rendering issues due to
			// completely opaque text using a different rendering method.
			scene.style.opacity = Math.min(ratio, 0.999);
			query('audio', scene).forEach(function(audio) {
				audio.volume = Math.min(ratio, 1);
			});
			
			// Update the scene being faded out.
			fadeOut(ms);
		};
		
		update(0);
		return update;
	};
	
	function startImage(image, scene) {
		var node = document.createElement('div');
		node.style.backgroundImage = 'url("' + encodeURI(image.url) + '")';
		node.className = 'image';
		scene.appendChild(node);
	}
	
	start.sound = function(sound, scene, dependencies) {
		var tracks = sound.tracks.slice();
		var loop = 'loop' in sound ? sound.loop : true;
		var shuffle = 'shuffle' in sound ? sound.shuffle : true;
		var overlap = sound.overlap || 0;
		var audio = dependencies.audio;
		var shuffleArray = dependencies.shuffle || function(x) { return x; };
		
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
	
	function stop(stage, fade) {
		if ( stage.children.length === 0 ) {
			return function() {};
		}
		
		if ( !fade ) {
			fade = 0;
		}
		
		var removed = false;
		var update = function update(ms) {
			if ( removed ) {
				return;
			}
			
			var scene = stage.children[0];
			var ratio = fade === 0 ? 0 : 1 - (ms / fade);
			
			if ( ratio <= 0 ) {
				scene.remove();
				removed = true;
			}
			else {
				// Note that the we don't set the opacity to exactly 1.0,
				// because that can cause some undesirable text rendering issues
				// due to completely opaque text using a different rendering
				// method.
				scene.style.opacity = Math.min(ratio, 0.999);
				query('audio', scene).forEach(function(audio) {
					audio.volume = Math.min(ratio, 1);
				});
			}
		};
		
		update(0);
		return update;
	}
	
	function query(expression, node) {
		return Array.prototype.slice.call(node.querySelectorAll(expression));
	}
	
	return {
		start: start,
		stop: stop
	};
})();