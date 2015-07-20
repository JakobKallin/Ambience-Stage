import ambience from '/source/scene.js';
import Timer from '/tests/timer.js';

export default function() {
    var assert = chai.assert;
    var assertEqual = chai.assert.deepEqual;
    var assertError = chai.assert.throws;
    
    function nothing() {}
    
    var timer;
    var advance;
    var events;
    var start;
    var defaultCallbacks;
    
    function extend(object, newProperty, value) {
        var newObject = {};
        for ( var property in object ) {
            newObject[property] = object[property];
        }
        newObject[newProperty] = value;
        return newObject;
    }
    
    setup(function() {
        timer = Timer();
        advance = timer.advance;
        events = [];
        defaultCallbacks = {
            start: {
                track: function(url, update) {
                    timer.track(update);
                    events.push('start ' + url);
                    return {
                        stop: function() {
                            events.push('stop ' + url);
                        },
                        duration: function() {
                            return 1;
                        }
                    };
                }
            },
            time: timer.time
        };
        start = function(items, callbacks) {
            callbacks = callbacks || defaultCallbacks;
            return ambience(items, 0, callbacks);
        };
    });
    
    test('no tracks', function() {
        assertError(function() {
            start([{
                type: 'sound',
                tracks: []
            }]);
        });
    });
    
    test('single track', function() {
        start([{
            type: 'sound',
            tracks: ['test']
        }]);
        advance(0);
        
        assertEqual(events, ['start test']);
    });
    
    test('single track, no loop', function() {
        start([{
            type: 'sound',
            tracks: ['test'],
            loop: false
        }]);
        advance(0);
        advance(1);
        
        assertEqual(events, ['start test', 'stop test']);
    });
    
    test('single track, loop', function() {
        start([{
            type: 'sound',
            tracks: ['test'],
            loop: true
        }]);
        advance(0);
        advance(1);
        
        assertEqual(events, ['start test', 'stop test', 'start test']);
    });
    
    test('track stops even when ticked higher than duration', function() {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }]);
        advance(0);
        advance(1.1);
        
        assertEqual(events, ['start one', 'stop one']);
    });
    
    test('two tracks, no loop', function() {
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            loop: false
        }]);
        advance(0);
        advance(1);
        advance(1);
        
        assertEqual(events, ['start one', 'stop one', 'start two', 'stop two']);
    });
    
    test('two tracks, loop', function() {
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            loop: true
        }]);
        advance(0);
        advance(1);
        advance(1);
        advance(1);
        
        assertEqual(events, [
            'start one',
            'stop one',
            'start two',
            'stop two',
            'start one',
            'stop one',
            'start two'
        ]);
    });
    
    test('three tracks, no loop', function() {
        start([{
            type: 'sound',
            tracks: ['one', 'two', 'three'],
            loop: false
        }]);
        advance(0);
        advance(1);
        advance(1);
        advance(1);
        
        assertEqual(events, [
            'start one',
            'stop one',
            'start two',
            'stop two',
            'start three',
            'stop three'
        ]);
    });
    
    // Just testing with two tracks misses error of the type "first track is
    // always played, second is scheduled right afterwards, but the third
    // one is scheduled later and using a different method and thus fails",
    // so we try with three tracks to be on the safe side.
    test('three tracks, loop', function() {
        start([{
            type: 'sound',
            tracks: ['one', 'two', 'three'],
            loop: true
        }]);
        advance(0);
        advance(1);
        advance(1);
        advance(1);
        advance(1);
        advance(1);
        
        assertEqual(events, [
            'start one',
            'stop one',
            'start two',
            'stop two',
            'start three',
            'stop three',
            'start one',
            'stop one',
            'start two',
            'stop two',
            'start three'
        ]);
    });
    
    test('single track, no loop, overlap', function() {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false,
            overlap: 0.2
        }]);
        advance(0);
        advance(0.8);
        
        assertEqual(events, ['start one']);
    });
    
    test('single track, loop, overlap', function() {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: true,
            overlap: 0.2
        }]);
        advance(0);
        advance(0.8);
        
        assertEqual(events, ['start one', 'start one']);
    });
    
    test('single overlap regardless of number of ticks', function() {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: true,
            overlap: 0.2
        }]);
        advance(0);
        advance(0.81);
        advance(0.01);
        advance(0.01);
        
        assertEqual(events, ['start one', 'start one']);
    });
    
    test('overlapping track starts tracking time immediately', function() {
        start([{
            type: 'sound',
            tracks: ['one', 'two', 'three'],
            loop: false,
            overlap: 0.2
        }]);
        advance(0);
        advance(0.8); // Track two should start here, as the secondary track.
        advance(0.2); // Track two should now be the primary track, with 0.2 elapsed.
        advance(0.6); // Track three should start here.
        
        assertEqual(events, ['start one', 'start two', 'stop one', 'start three']);
    });
    
    test('overlapping track starts tracking time immediately, accounting for offset', function() {
        start([{
            type: 'sound',
            tracks: ['one', 'two', 'three'],
            loop: false,
            overlap: 0.2
        }]);
        advance(0);
        advance(0.8); // Track two should start here, as the secondary track.
        advance(0.3); // Track two should now be the primary track, with 0.3 elapsed.
        advance(0.5); // Track three should start here.
        
        assertEqual(events, ['start one', 'start two', 'stop one', 'start three']);
    });
    
    test('single track, no loop, shuffle', function() {
        start([{
            type: 'sound',
            tracks: ['test'],
            loop: false,
            shuffle: true
        }]);
        advance(0);
        advance(1);
        
        assertEqual(events, ['start test', 'stop test']);
    });
    
    test('single track, loop, shuffle', function() {
        start([{
            type: 'sound',
            tracks: ['test'],
            loop: true,
            shuffle: true
        }]);
        advance(0);
        advance(1);
        
        assertEqual(events, ['start test', 'stop test', 'start test']);
    });
    
    test('two tracks, no loop, shuffle', function() {
        var callbacks = extend(
            defaultCallbacks,
            'shuffle',
            constant(['two', 'one'])
        );
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            loop: false,
            shuffle: true
        }], callbacks);
        advance(0);
        advance(1);
        
        assertEqual(events, ['start two', 'stop two', 'start one']);
    });
    
    test('two tracks, loop, shuffle', function() {
        var callbacks = extend(
            defaultCallbacks,
            'shuffle',
            constant(['two', 'one'])
        );
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            loop: true,
            shuffle: true
        }], callbacks);
        advance(0);
        advance(1);
        
        assertEqual(events, ['start two', 'stop two', 'start one']);
    });
    
    test('two tracks, loop, shuffle twice', function() {
        var shuffleCount = 0;
        var shuffle = function() {
            shuffleCount += 1;
            if ( shuffleCount === 1 ) {
                return ['two', 'one'];
            }
            else if ( shuffleCount === 2 ) {
                return ['one', 'two'];
            }
            else {
                throw new Error('Tracks shuffled too many times.');
            }
        };
        var callbacks = extend(defaultCallbacks, 'shuffle', shuffle);
        
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            loop: true,
            shuffle: true
        }], callbacks);
        advance(0);
        advance(1);
        advance(1);
        advance(1);
        
        assertEqual(events, [
            'start two',
            'stop two',
            'start one',
            'stop one',
            'start one',
            'stop one',
            'start two'
        ]);
    });
    
    test('multiple tracklists, different overlap', function() {
        start([
            {
                type: 'sound',
                tracks: ['one'],
                overlap: 0.2,
                loop: true
            },
            {
                type: 'sound',
                tracks: ['two'],
                overlap: 0.5,
                loop: true
            }
        ]);
        advance(0);
        advance(0.5);
        advance(0.3);
        
        assertEqual(events, ['start one', 'start two', 'start two', 'start one']);
    });
    
    test('track plays during overlap', function() {
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            overlap: 0.2
        }])
        advance(0);
        advance(0.8);
        advance(0.1);
        
        assertEqual(events, ['start one', 'start two']);
    });
    
    test('track stops after overlap', function() {
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            overlap: 0.2
        }])
        advance(0);
        advance(0.8);
        advance(0.2);
        
        assertEqual(events, ['start one', 'start two', 'stop one']);
    });
    
    test('last track stops, no loop', function() {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }])
        advance(0);
        advance(1);
        
        assertEqual(events, ['start one', 'stop one']);
    });
    
    test('last track stops, loop', function() {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: true
        }])
        advance(0);
        advance(1);
        
        assertEqual(events, ['start one', 'stop one', 'start one']);
    });
    
    test('sound starts', function() {
        watchSoundEvents(defaultCallbacks);
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }]);
        
        assertEqual(events, ['start', 'start one']);
    });
    
    test('non-looping sound stops', function() {
        watchSoundEvents(defaultCallbacks);
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }]);
        advance(1);
        
        assertEqual(events, ['start', 'start one', 'stop one', 'stop']);
    });
    
    test('looping sound does not stop', function() {
        watchSoundEvents(defaultCallbacks);
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: true
        }]);
        advance(1);
        
        assertEqual(events, ['start', 'start one', 'stop one', 'start one']);
    });
    
    test('non-looping sound stops, two tracks', function() {
        watchSoundEvents(defaultCallbacks);
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            loop: false
        }]);
        advance(1);
        advance(1);
        
        assertEqual(events, ['start', 'start one', 'stop one', 'start two', 'stop two', 'stop']);
    });
    
    function watchSoundEvents(callbacks) {
        callbacks.start.sound = function() {
            events.push('start');
            return function stop() {
                events.push('stop');
            };
        };
    }
    
    test('non-looping sound-only scene stops after last track', function() {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }], sceneCallbacks());
        advance(1);
        
        assertEqual(events, ['start scene', 'start sound', 'stop sound', 'stop scene']);
    });
    
    test('looping sound-only scene does not stop after last track', function() {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: true
        }], sceneCallbacks());
        advance(1);
        
        assertEqual(events, ['start scene', 'start sound']);
    });
    
    test('non-looping sound scene with other media does not stop after last track', function() {
        start([
            {
                type: 'sound',
                tracks: ['one'],
                loop: false
            },
            { type: 'image', url: 'image' }
        ], sceneCallbacks());
        advance(1);
        
        assertEqual(events, ['start scene', 'start sound', 'stop sound']);
    });
    
    test('non-looping sound stops during fade-out', () => {
        var stop = start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }], sceneCallbacks());
        stop(2);
        advance(1);
        
        assertEqual(events, ['start scene', 'start sound', 'stop sound', 'stop scene']);
    });
    
    function sceneCallbacks() {
        return {
            start: {
                scene: function() {
                    events.push('start scene');
                    return {
                        stop: function() {
                            events.push('stop scene');
                        },
                        fade: nothing
                    };
                },
                sound: function() {
                    events.push('start sound');
                    return function() {
                        events.push('stop sound');
                    };
                },
                track: function(url, update) {
                    timer.track(update);
                    return {
                        stop: nothing,
                        duration: constant(1)
                    };
                },
                image: constant(nothing)
            },
            time: timer.time
        };
    }
    
    function constant(value) {
        return function() {
            return value;
        };
    }
}
