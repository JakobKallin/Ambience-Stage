AmbienceStage.Background = function(node) {
	var defaultBackground = AmbienceStage.Scene.base.background;
	
	function play(scene) {
		if ( scene.background ) {
			node.style.background = scene.background;
		}
	}
	
	function stop() {
		node.style.background = defaultBackground;
	}
	
	return {
		play: play,
		stop: stop
	};
};