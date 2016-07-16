import startSound from './sound';

export default function startScene(items, fadeInDuration, outside) {
    fadeInDuration = fadeInDuration || 0;
    const time = outside.time || (() => new Date());
    const startTime = time();
    let hasEnded = false;
    let handles;
    let sceneHandle;
    
    let updateFade = function updateFadeIn() {
        const ratio = fadeRatio(startTime, time(), fadeInDuration);
        sceneHandle.fade.in.step(ratio);
        handles.forEach(function(handle) {
            if (handle.fade) handle.fade(ratio);
        });
        
        if ( ratio === 1 ) {
            sceneHandle.fade.in.stop();
            updateFade = nothing;
        }
    };
        
    function start(items, fadeInDuration, outside) {
        sceneHandle = overlay(outside.scene(update), {
            stop: nothing,
            fade: {
                in: {
                    step: nothing,
                    stop: nothing
                },
                out: {
                    start: nothing,
                    step: nothing
                }
            },
            sound: () => nothing,
            image: () => nothing
        });
        sceneHandle.fade.in.step = callableUntil(sceneHandle.fade.in.step, ratio => ratio === 1);
        sceneHandle.fade.in.stop = once(sceneHandle.fade.in.stop);
        sceneHandle.fade.out.step = callableUntil(sceneHandle.fade.out.step, ratio => ratio === 0);
        
        handles = items.map(function(item) {
            if ( item.type === 'sound' ) {
                const callbacks = {
                    time: time,
                    shuffle: outside.shuffle,
                    sound: sceneHandle.sound,
                    track: sceneHandle.track
                };
                return startSound(item, callbacks, () => {
                    if (onlySound(items)) end();
                });
            }
            else {
                return sceneHandle[item.type](item, update);
            }
        });
        
        return stop;
    }
    
    function onlySound(items) {
        return items.every(i => i.type === 'sound');
    }
    
    function update() {
        handles.forEach(function(handle) {
            if ( handle.update ) {
                handle.update();
            }
        });
        updateFade();
    }
    
    const stop = once(fadeOutDuration => {
        const stopTime = time();
        sceneHandle.fade.in.step(1);
        sceneHandle.fade.in.stop();
        updateFade = function updateFadeOut() {
            const ratio = 1 - fadeRatio(stopTime, time(), fadeOutDuration);
            sceneHandle.fade.out.step(ratio);
            handles.forEach(function(handle) {
                if (handle.fade) handle.fade(ratio);
            });
            
            if ( ratio === 0 ) {
                end();
            }
        };
        sceneHandle.fade.out.start();
        
        if ( fadeOutDuration === 0 ) {
            end();
        }
        
        return end;
    });
    
    function end() {
        if ( !hasEnded ) {
            hasEnded = true;
            updateFade = nothing;
            sceneHandle.fade.out.step(0);
            handles.forEach(function(handle) {
                handle.stop();
            });
            sceneHandle.stop();
        }
    }
    
    function fadeRatio(startTime, currentTime, duration) {
        const elapsed = currentTime - startTime;
        if ( duration === 0 ) {
            return 1;
        }
        else {
            const ratio = elapsed / duration;
            const boundedRatio = Math.min(Math.max(ratio, 0), 1);
            return boundedRatio;
        }
    }
    
    function nothing() {}
    
    function once(callback) {
        let called = false;
        let result = null;
        return function() {
            if (!called) {
                called = true;
                result = callback.apply(undefined, arguments);
            }
            return result;
        };
    }
    
    function callableUntil(callback, predicate) {
        let limitReached = false;
        return function() {
            const args = arguments;
            if (!limitReached) {
                callback.apply(undefined, args);
            }
            limitReached = predicate.apply(undefined, args);
        };
    }
    
    function overlay(extra, base) {
        const result = copy(base);
        for (var property in extra) {
            if (property in result && typeof result[property] === 'object') {
                result[property] = overlay(extra[property], result[property]);
            }
            else {
                result[property] = extra[property];
            }
        }
        return result;
    }
    
    function copy(object) {
        const result = {};
        for (var property in object) {
            if (typeof object[property] === 'object') {
                result[property] = copy(object[property]);
            }
            else {
                result[property] = object[property];
            }
        }
        return result;
    }
    
    return start(items, fadeInDuration, outside);
};
