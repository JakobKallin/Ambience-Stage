import stage from '/source/stage.js';
import Timer from '/tests/timer.js';

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
            start: {
                scene: function(update) {
                    var scene = latestScene + 1;
                    latestScene = scene;
                    timer.track(update);
                    events.push('start ' + scene);
                    return {
                        stop: function() {
                            events.push('stop ' + scene);
                        },
                        fade: function(ratio) {
                            events.push('fade ' + scene + ' ' + (ratio * 100) + '%');
                        }
                    };
                }
            },
            time: timer.time
        });
    });
    
    test('crossfade', function() {
        start([]);
        start([], 1000);
        advance(250);
        
        assertEqual(events, ['start 0', 'start 1', 'fade 0 75%', 'fade 1 25%']);
    });
    
    test('crossfade twice', function() {
        start([]);
        start([], 1000);
        start([], 1000);
        advance(250);
        
        assertEqual(events, [
            'start 0',
            'start 1',
            'stop 0',
            'start 2',
            'fade 1 75%',
            'fade 2 25%'
        ]);
    });
};
