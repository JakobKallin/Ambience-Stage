import startSound from './sound.js';

export default function startScene(items, fadeInDuration, outside) {
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
                // This stops the scene after the first non-looping sound, even
                // if there are multiple. Preferable it should stop only after
                // the last one.
                if ( onlySound(items) ) {
                    outside.start.sound = stopSceneAfterwards(outside.start.sound);
                }
                return startSound(item, outside);
            }
            else {
                return outside.start[item.type](item, update);
            }
        });
        return stop;
    }
    
    function onlySound(items) {
        return items.every(i => i.type === 'sound');
    }
    
    function stopSceneAfterwards(startSound) {
        var startSound = startSound || constant(nothing);
        return function() {
            var stopSound = startSound();
            return function() {
                stopSound();
                stop(0);
            };
        };
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
    
    function constant(value) {
        return function() {
            return value;
        };
    }
};
