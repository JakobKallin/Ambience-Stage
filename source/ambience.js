'use strict';

var ambience = {
    start: {}
};

ambience.start.scene = function(items, fadeInDuration, outside) {
    var startTime = outside.time();
    var hasEnded = false;
    var handles = [];
    var outsideEndScene;
    
    var updateFade = function updateFadeIn() {
        var ratio = fadeRatio(startTime, outside.time(), fadeInDuration);
        outside.fade.scene.in(ratio);
        handles.forEach(function(handle) {
            handle.fade(ratio);
        });
        
        if ( ratio === 1 ) {
            updateFade = nothing;
        }
    };
    
    return start(items, fadeInDuration, outside);
    
    function start(items, fadeInDuration, outside) {
        outsideEndScene = outside.start.scene ? outside.start.scene(update) : nothing;
        handles = items.map(function(item) {
            return outside.start[item.type](item, update);
        });
        return stop;
    }
    
    function update() {
        updateFade();
    }
    
    function stop(fadeOutDuration) {
        if ( stopTime ) {
            return;
        }
        
        var stopTime = outside.time();
        updateFade = function updateFadeOut() {
            var ratio = fadeRatio(stopTime, outside.time(), fadeOutDuration);
            outside.fade.scene.out(ratio);
            handles.forEach(function(handle) {
                handle.fade(ratio);
            });
            
            if ( ratio === 1 ) {
                end();
            }
        };
        
        if ( fadeOutDuration === 0 ) {
            end();
        }
        
        return end;
    }
    
    function end() {
        if ( !hasEnded ) {
            hasEnded = true;
            updateFade = nothing;
            handles.forEach(function(handle) {
                handle.stop();
            });
            outsideEndScene();
        }
    }
    
	function fadeRatio(startTime, currentTime, duration) {
        var elapsed = currentTime - startTime;
		if ( duration === 0 ) {
			return 1;
		}
		else {
			var ratio = elapsed / duration;
			var boundedRatio = Math.min(Math.max(ratio, 0), 1);
			return boundedRatio;
		}
	}
    
    function nothing() {}
};
