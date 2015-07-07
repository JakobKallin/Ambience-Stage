'use strict';

var ambience = {
    start: {}
};

ambience.start.scene = function(items, fadeInDuration, outside) {
    var startTime = outside.time();
    var hasEnded = false;
    var handles = [];
    var sceneHandle;
    
    var updateFade = function updateFadeIn() {
        var ratio = fadeRatio(startTime, outside.time(), fadeInDuration);
        sceneHandle.fade(ratio);
        handles.forEach(function(handle) {
            handle.fade(ratio);
        });
        
        if ( ratio === 1 ) {
            updateFade = nothing;
        }
    };
    
    return start(items, fadeInDuration, outside);
    
    function start(items, fadeInDuration, outside) {
        sceneHandle = outside.start.scene ? outside.start.scene(update) : { stop: nothing, fade: nothing };
        handles = items.map(function(item) {
            if ( item.type === 'sound' ) {
                return ambience.start.sound(item, outside);
            }
            else {
                return outside.start[item.type](item, update);
            }
        });
        return stop;
    }
    
    function update() {
        updateFade();
        handles.forEach(function(handle) {
            if ( handle.update ) {
                handle.update();
            }
        });
    }
    
    function stop(fadeOutDuration) {
        if ( stopTime ) {
            return;
        }
        
        var stopTime = outside.time();
        updateFade = function updateFadeOut() {
            var ratio = fadeRatio(stopTime, outside.time(), fadeOutDuration);
            sceneHandle.fade(1 - ratio);
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
            sceneHandle.stop();
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

ambience.start.sound = function(sound, outside) {
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
    
    var counter = 1;
    var updateLatest = startTrack(0);
    
    return {
        stop: nothing
    };
    
    function updateSound() {
        updateLatest();
    }
    
    function startTrack(index) {
        var startTime = outside.time();
        var handle = outside.start.track(tracks[index], updateSound);
        var updateNext = null;
        
        return function update() {
            var currentTime = outside.time();
            var elapsed = currentTime - startTime;
            
            if ( elapsed >= handle.duration() ) {
                handle.stop();
            }
            
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
                else {
                    // This must be here because if neither clause above is 
                    // entered, we will have the same update function and will 
                    // stop the track too many times if the update function is
                    // called more than once.
                    updateNext = nothing;
                }
            }
            
            if ( elapsed >= handle.duration() && updateNext ) {
                updateLatest = updateNext;
            }
        };
    }
    
    function nothing() {}
};
