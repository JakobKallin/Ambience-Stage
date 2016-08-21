import createStage from '../../source/stage';
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
    let volume;
    let imageScene;

    setup(() => {
        timer = Timer();
        advance = timer.advance;
        events = [];
        imageScene = [{
            type: 'image',
            url: 'transparent-10.png'
        }];
        let latestScene = -1;
        const stage = createStage({
            scene: update => {
                const scene = latestScene + 1;
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
                    stop: () => {
                        events.push('stop ' + scene);
                    },
                    sound: () => ({
                        stop: () => {},
                        track: url => ({
                            stop: () => {},
                            duration: () => 1000,
                            fade: ratio => {
                                events.push('fade track ' + url + ' ' + (ratio * 100) + '%');
                            }
                        })
                    }),
                    image: () => ({
                        stop: () => {}
                    })
                };
            },
            time: timer.time,
            shuffle: x => x
        });
        start = stage.start;
        volume = stage.volume;
    });

    function filter(events, f) {
        return events.filter(e => e.match(f));
    }

    test('crossfade', () => {
        start(imageScene);
        start(imageScene, 1000);
        advance(250);

        assertEqual(events, [
            'start 0',
            'fade in 0 100%',
            'stop fade in 0',
            'start fade out 0',
            'fade out 0 100%',
            'start 1',
            'fade out 0 75%',
            'fade in 1 25%'
        ]);
    });

    test('crossfade twice', () => {
        start(imageScene);
        start(imageScene, 1000);
        start(imageScene, 1000);
        advance(250);

        assertEqual(events, [
            'start 0',
            'fade in 0 100%',
            'stop fade in 0',
            'start fade out 0',
            'fade out 0 100%',
            'start 1',
            'fade out 0 0%',
            'stop 0',
            'fade in 1 100%',
            'stop fade in 1',
            'start fade out 1',
            'fade out 1 100%',
            'start 2',
            'fade out 1 75%',
            'fade in 2 25%'
        ]);
    });

    test('volume change before crossfade', () => {
        start([{
            type: 'sound',
            tracks: ['first']
        }]);
        volume(0.5);
        start([{
            type: 'sound',
            tracks: ['second']
        }], 1000);
        advance(250);

        assertEqual(filter(events, /fade track/), [
            'fade track first 0%',
            'fade track first 50%',
            'fade track first 50%',
            'fade track second 0%',
            'fade track first 37.5%',
            'fade track second 12.5%'
        ]);
    });

    test('volume change during crossfade', () => {
        start([{
            type: 'sound',
            tracks: ['first']
        }]);
        start([{
            type: 'sound',
            tracks: ['second']
        }], 1000);
        volume(0.5);
        advance(250);

        assertEqual(filter(events, /fade track/), [
            'fade track first 0%',
            'fade track first 100%',
            'fade track second 0%',
            'fade track first 50%',
            'fade track second 0%',
            'fade track first 37.5%',
            'fade track second 12.5%'
        ]);
    });
};
