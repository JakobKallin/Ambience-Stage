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
    
    let events;
    let start;
    let timer;
    let advance;

    setup(function() {
        timer = Timer();
        advance = timer.advance;
        events = [];
        
        const callbacks = {
            scene: update => ({
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
            }),
            time: timer.time
        };
        
        start = function(items, fade) {
            fade = fade || 0;
            return ambience(items, fade, callbacks);
        };
    });

    test('start', () => {
        start([{ type: 'image', url: 'image' }]);
        
        assertEqual(events, ['start image']);
    });

    test('stop', () => {
        const stop = start([{ type: 'image', url: 'image' }]);
        stop(0);
        
        assertEqual(events, ['start image', 'stop image']);
    });

    test('fade in', () => {
        const stop = start([{ type: 'image', url: 'image' }], 1000);
        advance(500);
        
        assertEqual(events, ['start image', 'fade 50% image']);
    });

    test('fade out', () => {
        const stop = start([{ type: 'image', url: 'image' }]);
        stop(1000);
        advance(500);
        
        assertEqual(events, ['start image', 'fade 50% image']);
    });
};
