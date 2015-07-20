import ambience from '/source/scene.js';
import Timer from '/tests/timer.js';

export default function() {
    var assert = chai.assert;
    var assertEqual = chai.assert.deepEqual;
    var assertError = chai.assert.throws;
    
    var events;
    var start;
    var timer;
    var advance;

    setup(function() {
        timer = Timer();
        advance = timer.advance;
        events = [];
        
        var callbacks = {
            start: {
                image: function(image, update) {
                    timer.track(update);
                    events.push('start ' + image.url);
                    return {
                        stop: function() {
                            events.push('stop ' + image.url);
                        },
                        fade: function(ratio) {
                            events.push('fade ' + (ratio * 100) + '% ' + image.url);
                        }
                    };
                }
            },
            time: timer.time
        };
        
        start = function(items, fade) {
            fade = fade || 0;
            return ambience(items, fade, callbacks);
        };
    });

    test('start', function() {
        start([{ type: 'image', url: 'image' }]);
        
        assertEqual(events, ['start image']);
    });

    test('stop', function() {
        var stop = start([{ type: 'image', url: 'image' }]);
        stop(0);
        
        assertEqual(events, ['start image', 'stop image']);
    });

    test('fade in', function() {
        var stop = start([{ type: 'image', url: 'image' }], 1000);
        advance(500);
        
        assertEqual(events, ['start image', 'fade 50% image']);
    });

    test('fade out', function() {
        var stop = start([{ type: 'image', url: 'image' }]);
        stop(1000);
        advance(500);
        
        assertEqual(events, ['start image', 'fade 50% image']);
    });
};