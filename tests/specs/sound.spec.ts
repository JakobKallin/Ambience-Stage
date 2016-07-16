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
    let start;
    const defaultFilter = e => !e.match(/(start|stop) (scene|sound)/);
        
    setup(() => {
        timer = Timer();
        advance = timer.advance;
        events = [];
        start = function(items, callbacks, fade) {
            fade = fade || 0;
            callbacks = callbacks || createCallbacks(defaultFilter);
            return ambience(items, fade, callbacks);
        };
    });
    
    function nothing() {}
    
    function extend(object, newProperty, value) {
        const newObject = {};
        for (const property in object) {
            newObject[property] = object[property];
        }
        newObject[newProperty] = value;
        return newObject;
    }
    
    function createCallbacks(filter, change?) {
        const callbacks = {
            start: {
                scene: update => {
                    timer.track(update);
                    log('start scene');
                    return {
                        stop: () => {
                            log('stop scene');
                        }
                    };
                },
                sound: () => {
                    log('start sound');
                    return () => log('stop sound');
                },
                track: url => {
                    log('start ' + url);
                    return {
                        stop: () => log('stop ' + url),
                        duration: () => 1,
                        fade: nothing
                    };
                },
                image: () => nothing
            },
            time: timer.time,
            shuffle: x => x
        };
        
        change = change || (x => x);
        change(callbacks);
        
        return callbacks;
        
        function log(event) {
            if (!filter || typeof filter === 'function' && filter(event) || event.match(filter)) {
                events.push(event);
            }
        }
    }
    
    function soundCallbacks() {
        return createCallbacks(e => !e.match(/(start|stop) (scene)/));
    }
    
    test('no tracks', () => {
        assertError(() => {
            start([{
                type: 'sound',
                tracks: []
            }]);
        });
    });
    
    test('single track', () => {
        start([{
            type: 'sound',
            tracks: ['test']
        }]);
        advance(0);
        
        assertEqual(events, ['start test']);
    });
    
    test('single track, no loop', () => {
        start([{
            type: 'sound',
            tracks: ['test'],
            loop: false
        }]);
        advance(0);
        advance(1);
        
        assertEqual(events, ['start test', 'stop test']);
    });
    
    test('single track, loop', () => {
        start([{
            type: 'sound',
            tracks: ['test'],
            loop: true
        }]);
        advance(0);
        advance(1);
        
        assertEqual(events, ['start test', 'stop test', 'start test']);
    });
    
    test('track stops even when ticked higher than duration', () => {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }]);
        advance(0);
        advance(1.1);
        
        assertEqual(events, ['start one', 'stop one']);
    });
    
    test('track does not stop until duration is known', () => {
        const callbacks = createCallbacks(defaultFilter, c => {
            // Change the callbacks so that NaN is returned from the first and
            // second call to `duration`.
            const defaultStartTrack = c.start.track;
            c.start.track = (url) => {
                const handle = defaultStartTrack(url);
                const originalDuration = handle.duration;
                let called = 0;
                handle.duration = () => {
                    called += 1;
                    if (called <= 2) {
                        return NaN;
                    }
                    else {
                        return originalDuration();
                    }
                }
                return handle;
            };
        });
        
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }], callbacks);
        advance(0);
        advance(1.1);
        assertEqual(events, ['start one']);
        
        advance(0.1);
        assertEqual(events, ['start one', 'stop one']);
    });
    
    test('two tracks, no loop', () => {
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
    
    test('two tracks, loop', () => {
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
    
    test('three tracks, no loop', () => {
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
    // one is scheduled later using a different method and thus fails",
    // so we try with three tracks to be on the safe side.
    test('three tracks, loop', () => {
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
    
    test('single track, no loop, overlap', () => {
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
    
    test('single track, loop, overlap', () => {
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
    
    test('single overlap regardless of number of ticks', () => {
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
    
    test('overlapping track starts tracking time immediately', () => {
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
    
    test('overlapping track starts tracking time immediately, accounting for offset', () => {
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
    
    test('single track, no loop, shuffle', () => {
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
    
    test('single track, loop, shuffle', () => {
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
    
    test('two tracks, no loop, shuffle', () => {
        const callbacks = createCallbacks(defaultFilter, c => {
            c.shuffle = () => ['two', 'one'];
        });
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
    
    test('two tracks, loop, shuffle', () => {
        const callbacks = createCallbacks(defaultFilter, c => {
            c.shuffle = () => ['two', 'one'];
        });
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
    
    test('two tracks, loop, shuffle twice', () => {
        let shuffleCount = 0;
        const shuffle = () => {
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
        const callbacks = createCallbacks(defaultFilter, c => c.shuffle = shuffle);
        
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
    
    test('multiple tracklists, different overlap', () => {
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
    
    test('track plays during overlap', () => {
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
    
    test('track stops after overlap', () => {
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
    
    test('last track stops, no loop', () => {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }])
        advance(0);
        advance(1);
        
        assertEqual(events, ['start one', 'stop one']);
    });
    
    test('last track stops, loop', () => {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: true
        }])
        advance(0);
        advance(1);
        
        assertEqual(events, ['start one', 'stop one', 'start one']);
    });
    
    test('sound starts', () => {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }], soundCallbacks());
        
        assertEqual(events, ['start sound', 'start one']);
    });
    
    test('non-looping sound stops', () => {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }], soundCallbacks());
        advance(1);
        
        assertEqual(events, ['start sound', 'start one', 'stop one', 'stop sound']);
    });
    
    test('looping sound does not stop', () => {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: true
        }], soundCallbacks());
        advance(1);
        
        assertEqual(events, ['start sound', 'start one', 'stop one', 'start one']);
    });
    
    test('non-looping sound stops, two tracks', () => {
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            loop: false
        }], soundCallbacks());
        advance(1);
        advance(1);
        
        assertEqual(events, ['start sound', 'start one', 'stop one', 'start two', 'stop two', 'stop sound']);
    });
    
    test('tracks stop after sound is stopped', () => {
        const stop = start([{
            type: 'sound',
            tracks: ['one']
        }], soundCallbacks());
        advance(0.5);
        stop(0);
        
        assertEqual(events, ['start sound', 'start one', 'stop one', 'stop sound']);
    });
    
    test('tracks stop after sound is stopped during overlap', () => {
        const stop = start([{
            type: 'sound',
            tracks: ['one', 'two'],
            overlap: 0.5
        }], soundCallbacks());
        advance(0.75);
        stop(0);
        
        assertEqual(events, ['start sound', 'start one', 'start two', 'stop one', 'stop two', 'stop sound']);
    });
    
    test('non-looping sound-only scene stops after last track', () => {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }], createCallbacks(/scene|sound/));
        advance(1);
        
        assertEqual(events, ['start scene', 'start sound', 'stop sound', 'stop scene']);
    });
    
    test('looping sound-only scene does not stop after last track', () => {
        start([{
            type: 'sound',
            tracks: ['one'],
            loop: true
        }], createCallbacks(/scene|sound/));
        advance(1);
        
        assertEqual(events, ['start scene', 'start sound']);
    });
    
    test('non-looping sound scene with other media does not stop after last track', () => {
        start([
            {
                type: 'sound',
                tracks: ['one'],
                loop: false
            },
            { type: 'image', url: 'image' }
        ], createCallbacks(/scene|sound/));
        advance(1);
        
        assertEqual(events, ['start scene', 'start sound', 'stop sound']);
    });
    
    test('non-looping sound stops during fade-out', () => {
        var stop = start([{
            type: 'sound',
            tracks: ['one'],
            loop: false
        }], createCallbacks(/scene|sound/));
        stop(2);
        advance(1);
        
        assertEqual(events, ['start scene', 'start sound', 'stop sound', 'stop scene']);
    });
    
    test('track fades in during scene fade-in', () => {
        start([{
            type: 'sound',
            tracks: ['one']
        }], fadeCallbacks(), 1);
        advance(0.25);
        assertEqual(events, ['start scene', 'start one', 'fade one 25%']);
    });
    
    test('track fades out during scene fade-out', () => {
        const stop = start([{
            type: 'sound',
            tracks: ['one']
        }], fadeCallbacks());
        stop(1);
        advance(0.25);
        assertEqual(events, ['start scene', 'start one', 'fade one 75%']);
    });
    
    test('tracks fade during overlap and scene fade', () => {
        start([{
            type: 'sound',
            tracks: ['one', 'two'],
            overlap: 0.8
        }], fadeCallbacks(), 1);
        advance(0.5);
        assertEqual(events, ['start scene', 'start one', 'start two', 'fade one 50%', 'fade two 50%'])
    });
    
    
    function fadeCallbacks() {
        return {
            start: {
                scene: update => {
                    timer.track(update);
                    events.push('start scene');
                    return {
                        stop: () => {
                            events.push('stop scene');
                        }
                    };
                },
                sound: () => nothing,
                track: function(url) {
                    events.push('start ' + url);
                    return {
                        stop: nothing,
                        fade: ratio => {
                            events.push('fade ' + url + ' ' + (ratio * 100) + '%');
                        },
                        duration: () => 1
                    };
                },
                image: () => nothing
            },
            time: timer.time
        };
    }
}
