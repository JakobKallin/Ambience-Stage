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
    
    function nothing() {}

    setup(() => {
        timer = Timer();
        advance = timer.advance;
        events = [];
        
        const callbacks = {
            scene: update => ({
                stop: nothing,
                image: (image, update) => {
                    timer.track(update);
                    events.push('start ' + image.url);
                    return {
                        stop: () => {
                            events.push('stop ' + image.url);
                        },
                        fade: ratio => {
                            events.push('fade ' + (ratio * 100) + '% ' + image.url);
                        }
                    };
                },
                fade: {
                    in: {
                        step: nothing,
                        stop: nothing
                    },
                    out: {
                        start: nothing,
                        step: nothing
                    }
                }
            }),
            time: timer.time
        };
        
        start = function(items, fade) {
            fade = fade || 0;
            return ambience(items, fade, 1, callbacks);
        };
    });

    test('start', () => {
        start([{ type: 'image', url: 'image' }]);
        
        assertEqual(events, ['start image']);
    });

    test('stop', () => {
        const scene = start([{ type: 'image', url: 'image' }]);
        scene.stop(0);
        
        assertEqual(events, ['start image', 'fade 0% image', 'stop image']);
    });

    test('fade in', () => {
        const scene = start([{ type: 'image', url: 'image' }], 1000);
        advance(500);
        
        assertEqual(events, ['start image', 'fade 50% image']);
    });

    test('fade out', () => {
        const scene = start([{ type: 'image', url: 'image' }]);
        scene.stop(1000);
        advance(500);
        
        assertEqual(events, ['start image', 'fade 100% image', 'fade 50% image']);
    });
};
