import stage from '../../source/stage';
import Timer from '../timer';

declare var chai:any;
declare var setup:any;
declare var suite:any;
declare var test:any;

export default function() {
    var assert = chai.assert;
    var assertEqual = chai.assert.deepEqual;
    var assertError = chai.assert.throws;
    
    var timer;
    var advance;
    var events;
    var start;
    
    setup(function() {
        timer = Timer();
        advance = timer.advance;
        events = [];
        var latestScene = -1;
        start = stage({
            scene: update => {
                var scene = latestScene + 1;
                latestScene = scene;
                timer.track(update);
                events.push('start ' + scene);
                return {
                    fade: {
                        in: {
                            step: ratio => {
                                events.push('fade in ' + scene + ' ' + (ratio * 100) + '%');
                            },
                            stop: () => events.push('stop fade in ' + scene)
                        },
                        out: {
                            start: () => events.push('start fade out ' + scene),
                            step: ratio => {
                                events.push('fade out ' + scene + ' ' + (ratio * 100) + '%');
                            }
                        }
                    },
                    stop: function() {
                        events.push('stop ' + scene);
                    },
                    track: () => ({
                        duration: () => 1,
                        fade: function() {},
                        stop: function() {}
                    })
                };
            },
            time: timer.time,
            shuffle: x => x
        });
    });
    
    function filter(events, f) {
        return events.filter(e => e.match(f));
    }
    
    test('crossfade', function() {
        start([]);
        start([], 1000);
        advance(250);
        
        assertEqual(events, [
            'start 0',
            'fade in 0 100%',
            'stop fade in 0',
            'start fade out 0',
            'start 1',
            'fade out 0 75%',
            'fade in 1 25%'
        ]);
    });
    
    test('crossfade twice', function() {
        start([]);
        start([], 1000);
        start([], 1000);
        advance(250);
        
        assertEqual(events, [
            'start 0',
            'fade in 0 100%',
            'stop fade in 0',
            'start fade out 0',
            'start 1',
            'fade out 0 0%',
            'stop 0',
            'fade in 1 100%',
            'stop fade in 1',
            'start fade out 1',
            'start 2',
            'fade out 1 75%',
            'fade in 2 25%'
        ]);
    });
};
