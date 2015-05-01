'use strict';

var ambience = (function() {
	function start(items, stage, fade) {
		if ( !fade ) {
			fade = 0;
		}
		
		var fadeOut = stop(stage, fade);
		
		var scene = document.createElement('div');
		
		var actions = {
			image: startImage,
			sound: startSound
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
	}
	
	function startImage(image, scene) {
		var node = document.createElement('div');
		node.style.backgroundImage = 'url("' + encodeURI(image.url) + '")';
		node.className = 'image';
		scene.appendChild(node);
	}
	
	function startSound(sound, scene) {
		var node = document.createElement('audio');
		node.src = sound.url;
		node.className = 'sound';
		scene.appendChild(node);
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
			
			if ( ratio === 0 ) {
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