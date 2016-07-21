import ambience from '../../source/scene';
import Timer from '../timer';

declare var chai:any;
declare var setup:any;
declare var suite:any;
declare var test:any;

export default function() {
    const assert = chai.assert;
    const assertEqual = chai.assert.deepEqual;
    const assertError = chai.assert.throws;

    let timer;
    let advance;
    let events;
    let callbacks;
    setup(() => {
        timer = Timer();
        advance = timer.advance;
        events = [];
        callbacks = {
            scene: update => {
                timer.track(update);
                events.push('start');
                return {
                    stop: function() {
                        events.push('stop');
                    },
                    fade: {
                        in: {
                            step: ratio => {
                                events.push('fade in ' + (ratio * 100) + '%');
                            },
                            stop: () => events.push('stop fade in')
                        },
                        out: {
                            start: () => events.push('start fade out'),
                            step: ratio => {
                                events.push('fade out ' + (ratio * 100) + '%');
                            }
                        }
                    }
                };
            },
            time: timer.time
        };
    });

    let start;

    setup(function() {
        start = function(items, fade=0) {
            return ambience(items, fade, callbacks);
        };
    });

    test('start scene', function() {
        start([]);
        
        assertEqual(events, ['start']);
    });

    test('stop scene', function() {
        const scene = start([]);
        scene.stop(0);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 0%', 'stop']);
    });

    test('stop scene twice', function() {
        const scene = start([]);
        scene.stop(0);
        scene.stop(0);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 0%', 'stop']);
    });

    test('abort scene without fading', function() {
        const scene = start([]);
        const abort = scene.stop(0);
        abort();
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 0%', 'stop']);
    });

    test('abort scene without fading twice', function() {
        const scene = start([]);
        const abort = scene.stop(0);
        abort();
        abort();
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 0%', 'stop']);
    });

    test('abort scene with fading, before', function() {
        const scene = start([]);
        const abort = scene.stop(1000);
        abort();
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 0%', 'stop']);
    });

    test('abort scene with fading, beginning', function() {
        const scene = start([]);
        const abort = scene.stop(1000);
        advance(0);
        abort();
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 100%', 'fade out 0%', 'stop']);
    });

    test('abort scene with fading, middle', function() {
        const scene = start([]);
        const abort = scene.stop(1000);
        advance(500);
        abort();
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 50%', 'fade out 0%', 'stop']);
    });

    test('abort scene with fading, end', function() {
        const scene = start([]);
        const abort = scene.stop(1000);
        advance(1000);
        abort();
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 0%', 'stop']);
    });

    test('abort scene with fading, after', function() {
        const scene = start([]);
        const abort = scene.stop(1000);
        advance(1500);
        abort();
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 0%', 'stop']);
    });

    test('fade in, before', function() {
        start([], 1000);
        
        assertEqual(events, ['start']);
    });

    test('fade in, beginning', function() {
        start([], 1000);
        advance(0);
        
        assertEqual(events, ['start', 'fade in 0%']);
    });

    test('fade in, middle', function() {
        start([], 1000);
        advance(500);
        
        assertEqual(events, ['start', 'fade in 50%']);
    });

    test('fade in, end', function() {
        start([], 1000);
        advance(1000);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in']);
    });

    test('fade in, after', function() {
        start([], 1000);
        advance(1500);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in']);
    });

    test('fade out, before', function() {
        const scene = start([]);
        scene.stop(1000);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%']);
    });

    test('fade out, beginning', function() {
        const scene = start([]);
        scene.stop(1000);
        advance(0);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 100%']);
    });

    test('fade out, middle', function() {
        const scene = start([]);
        scene.stop(1000);
        advance(500);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 50%']);
    });

    test('fade out, end', function() {
        const scene = start([]);
        scene.stop(1000);
        advance(1000);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 0%', 'stop']);
    });

    test('fade out, after', function() {
        const scene = start([]);
        scene.stop(1000);
        advance(1500);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 0%', 'stop']);
    });

    test('stop scene during fade-in', function() {
        const scene = start([], 1000);
        advance(500);
        scene.stop(0);
        advance(100);
        
        assertEqual(events, ['start', 'fade in 50%', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 0%', 'stop']);
    });

    test('fade out scene during fade-in', function() {
        const scene = start([], 1000);
        advance(500);
        scene.stop(1000);
        advance(100);
        
        assertEqual(events, ['start', 'fade in 50%', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 90%']);
    });

    test('abort scene during fade-out', function() {
        const scene = start([]);
        const abort = scene.stop(1000);
        advance(500);
        abort(0);
        advance(100);
        
        assertEqual(events, ['start', 'fade in 100%', 'stop fade in', 'start fade out', 'fade out 100%', 'fade out 50%', 'fade out 0%', 'stop']);
    });
};
