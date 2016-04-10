import ambience from '../../source/scene.js';
import Timer from '../timer.js';

export default function() {
    var assert = chai.assert;
    var assertEqual = chai.assert.deepEqual;
    var assertError = chai.assert.throws;

    var timer;
    var advance;
    var events;
    var callbacks;
    setup(() => {
        timer = Timer();
        advance = timer.advance;
        events = [];
        callbacks = {
            start: {
                scene: function(update) {
                    timer.track(update);
                    events.push('start');
                    return {
                        stop: function() {
                            events.push('stop');
                        },
                        fade: function(ratio) {
                            events.push('fade ' + (ratio * 100) + '%');
                        }
                    };
                }
            },
            time: timer.time
        };
    });

    var start;

    setup(function() {
        start = function(items, fade) {
            fade = fade || 0;
            return ambience(items, fade, callbacks);
        };
    });

    test('start scene', function() {
        start([]);
        
        assertEqual(events, ['start']);
    });

    test('stop scene', function() {
        var stop = start([]);
        stop(0);
        
        assertEqual(events, ['start', 'stop']);
    });

    test('stop scene twice', function() {
        var stop = start([]);
        stop(0);
        stop(0);
        
        assertEqual(events, ['start', 'stop']);
    });

    test('abort scene without fading', function() {
        var stop = start([]);
        var abort = stop(0);
        abort();
        
        assertEqual(events, ['start', 'stop']);
    });

    test('abort scene without fading twice', function() {
        var stop = start([]);
        var abort = stop(0);
        abort();
        abort();
        
        assertEqual(events, ['start', 'stop']);
    });

    test('abort scene with fading, before', function() {
        var stop = start([]);
        var abort = stop(1000);
        abort();
        
        assertEqual(events, ['start', 'stop']);
    });

    test('abort scene with fading, beginning', function() {
        var stop = start([]);
        var abort = stop(1000);
        advance(0);
        abort();
        
        assertEqual(events, ['start', 'fade 100%', 'stop']);
    });

    test('abort scene with fading, middle', function() {
        var stop = start([]);
        var abort = stop(1000);
        advance(500);
        abort();
        
        assertEqual(events, ['start', 'fade 50%', 'stop']);
    });

    test('abort scene with fading, end', function() {
        var stop = start([]);
        var abort = stop(1000);
        advance(1000);
        abort();
        
        assertEqual(events, ['start', 'fade 0%', 'stop']);
    });

    test('abort scene with fading, after', function() {
        var stop = start([]);
        var abort = stop(1000);
        advance(1500);
        abort();
        
        assertEqual(events, ['start', 'fade 0%', 'stop']);
    });

    test('fade in, before', function() {
        start([], 1000);
        
        assertEqual(events, ['start']);
    });

    test('fade in, beginning', function() {
        start([], 1000);
        advance(0);
        
        assertEqual(events, ['start', 'fade 0%']);
    });

    test('fade in, middle', function() {
        start([], 1000);
        advance(500);
        
        assertEqual(events, ['start', 'fade 50%']);
    });

    test('fade in, end', function() {
        start([], 1000);
        advance(1000);
        
        assertEqual(events, ['start', 'fade 100%']);
    });

    test('fade in, after', function() {
        start([], 1000);
        advance(1500);
        
        assertEqual(events, ['start', 'fade 100%']);
    });

    test('fade out, before', function() {
        var stop = start([]);
        stop(1000);
        
        assertEqual(events, ['start']);
    });

    test('fade out, beginning', function() {
        var stop = start([]);
        stop(1000);
        advance(0);
        
        assertEqual(events, ['start', 'fade 100%']);
    });

    test('fade out, middle', function() {
        var stop = start([]);
        stop(1000);
        advance(500);
        
        assertEqual(events, ['start', 'fade 50%']);
    });

    test('fade out, end', function() {
        var stop = start([]);
        stop(1000);
        advance(1000);
        
        assertEqual(events, ['start', 'fade 0%', 'stop']);
    });

    test('fade out, after', function() {
        var stop = start([]);
        stop(1000);
        advance(1500);
        
        assertEqual(events, ['start', 'fade 0%', 'stop']);
    });

    test('stop scene during fade-in', function() {
        var stop = start([], 1000);
        advance(500);
        stop(0);
        advance(100);
        
        assertEqual(events, ['start', 'fade 50%', 'stop']);
    });

    test('fade out scene during fade-in', function() {
        var stop = start([], 1000);
        advance(500);
        stop(1000);
        advance(100);
        
        assertEqual(events, ['start', 'fade 50%', 'fade 90%']);
    });

    test('abort scene during fade-out', function() {
        var stop = start([]);
        var abort = stop(1000);
        advance(500);
        abort(0);
        advance(100);
        
        assertEqual(events, ['start', 'fade 50%', 'stop']);
    });
};
