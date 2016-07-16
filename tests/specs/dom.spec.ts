import createDom from '../../source/dom';
import createStage from '../../source/stage';

declare var chai:any;
declare var setup:any;
declare var suite:any;
declare var test:any;

export default function() {
    const assert = chai.assert;
    const assertEqual = chai.assert.deepEqual;
    const assertAbove = chai.assert.isAbove;
    const assertBelow = chai.assert.isBelow;
    const nothing = () => {};
    
    let container;
    let dom;
    
    setup(function() {
        container = document.createElement('div');
        dom = createDom(container);
    });
    
    function scenes() {
        return <HTMLElement[]> Array.from(container.querySelectorAll('.scene'));
    }
    
    function images() {
        return <HTMLImageElement[]> Array.from(container.querySelectorAll('.image'));
    }
    
    function tracks() {
        return <HTMLAudioElement[]> Array.from(container.querySelectorAll('.track'));
    }
    
    suite('scene', function() {
        test('fade transparent', function() {
            const handle = dom.scene(nothing);
            handle.fade.in.step(0);
            
            assertEqual(parseFloat(scenes()[0].style.opacity), 0);
        });
        
        test('fade semi-transparent', function() {
            const handle = dom.scene(nothing);
            handle.fade.in.step(0.5);
            
            assertEqual(parseFloat(scenes()[0].style.opacity), 0.5);
        });
        
        test('fade opaque', function() {
            const handle = dom.scene(nothing);
            handle.fade.in.step(1);
            
            // We don't want to set opacity to exactly one because that might 
            // change the rendering method for text and introduce a noticeable 
            // "jump" visually.
            const opacity = parseFloat(scenes()[0].style.opacity);
            assertAbove(opacity, 0.99);
            assertBelow(opacity, 1);
        });
    });
    
    suite('image', function() {
        test('start', function() {
            const handle = dom.scene(nothing);
            handle.image({ url: 'transparent-10.png' });
            
            assertEqual(images().length, 1);
            assertEqual(images()[0].getAttribute('src'), 'transparent-10.png');
        });
        
        test('stop', function() {
            const sceneHandle = dom.scene(nothing);
            const imageHandle = sceneHandle.image({ url: 'transparent-10.png' });
            imageHandle.stop();
            
            assertEqual(images().length, 0);
        });
        
        test('stop one of many', function() {
            const sceneHandle = dom.scene(nothing);
            const first = sceneHandle.image({ url: 'transparent-10.png#1' });
            const second = sceneHandle.image({ url: 'transparent-10.png#2' });
            const third = sceneHandle.image({ url: 'transparent-10.png#3' });
            second.stop();
            
            assertEqual(images().length, 2);
            assertEqual(images()[0].getAttribute('src'), 'transparent-10.png#1');
            assertEqual(images()[1].getAttribute('src'), 'transparent-10.png#3');
        });
        
        test('style', function() {
            const handle = dom.scene(nothing);
            handle.image({
                url: 'transparent-10.png',
                style: {
                    objectFit: 'cover'
                }
            });
            
            assertEqual(images()[0].style['objectFit'], 'cover');
        });
    });
    
    suite('track', function() {
        test('start', function() {
            const handle = dom.scene(nothing).sound();
            handle.track('silence-1.ogg');
            const element = tracks()[0];
            
            assertEqual(tracks().length, 1);
            assertEqual(element.getAttribute('src'), 'silence-1.ogg');
            assertEqual(element.paused, false);
        });
        
        test('stop', function() {
            const soundHandle = dom.scene(nothing).sound();
            const trackHandle = soundHandle.track('silence-1.ogg');
            const element = tracks()[0];
            trackHandle.stop();
            
            assertEqual(tracks().length, 0);
            assertEqual(element.paused, true);
        });
        
        test('stop one of many', function() {
            const soundHandle = dom.scene(nothing).sound();
            const first = soundHandle.track('silence-1.ogg#1');
            const second = soundHandle.track('silence-1.ogg#2');
            const third = soundHandle.track('silence-1.ogg#3');
            const element = tracks()[1];
            second.stop();
            
            assertEqual(tracks().length, 2);
            assertEqual(tracks()[0].getAttribute('src'), 'silence-1.ogg#1');
            assertEqual(tracks()[1].getAttribute('src'), 'silence-1.ogg#3');
            assertEqual(element.paused, true);
        });
        
        test('fade transparent', function() {
            const soundHandle = dom.scene(nothing).sound();
            const trackHandle = soundHandle.track('silence-1.ogg');
            trackHandle.fade(0);
            
            assertEqual(tracks()[0].volume, 0);
        });
        
        test('fade semi-transparent', function() {
            const soundHandle = dom.scene(nothing).sound();
            const trackHandle = soundHandle.track('silence-1.ogg');
            trackHandle.fade(0.5);
            
            assertEqual(tracks()[0].volume, 0.5);
        });
        
        test('fade opaque', function() {
            const soundHandle = dom.scene(nothing).sound();
            const trackHandle = soundHandle.track('silence-1.ogg');
            trackHandle.fade(1);
            
            assertEqual(tracks()[0].volume, 1);
        });
        
        test('update', function() {
            let updates = 0;
            const sceneHandle = dom.scene(() => updates += 1);
            sceneHandle.fade.in.stop();
            const soundHandle = sceneHandle.sound();
            soundHandle.track('silence-1.ogg');
            
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    // The `timeupdate` event only triggers a few times per 
                    // second, so let's check for a reasonable range to get a 
                    // decent confidence in our result.
                    assertAbove(updates, 2);
                    assertBelow(updates, 10);
                    resolve();
                }, 1500);
            });
        });
        
        // The HTML5 spec says that `timeupdate` should trigger when an audio 
        // file ends, so this should not require a special case in the 
        // implementation.
        test('update on end', function() {
            let latestUpdate;
            const sceneHandle = dom.scene(() => {
                latestUpdate = tracks()[0].currentTime;
            });
            sceneHandle.fade.in.stop();
            const soundHandle = sceneHandle.sound();
            soundHandle.track('silence-1.ogg');
            
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    assertEqual(latestUpdate, tracks()[0].duration);
                    resolve();
                }, 1500);
            });
        });
        
        test('duration', () => {
            const soundHandle = dom.scene(nothing).sound();
            const trackHandle = soundHandle.track('silence-1.ogg');
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const duration = trackHandle.duration();
                    // Allow for some leeway in case the browser does not
                    // consider the file *exactly* one second long.
                    assertAbove(duration, 900);
                    assertBelow(duration, 1100);
                    resolve();
                }, 1500);
            });
        });
    });
    
    suite('complete', () => {
        test('single scene', () => {
            const stage = createStage(createDom(container));
            stage([
                { type: 'image', url: 'transparent-10.png' },
                { type: 'sound', tracks: ['silence-1.ogg'] }
            ]);
            
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    assertAbove(scenes()[0].style.opacity, 0.99);
                    assertEqual(images()[0].getAttribute('src'), 'transparent-10.png');
                    assertEqual(tracks()[0].volume, 1);
                    assert(!tracks()[0].paused);
                    resolve();
                }, 100);
            });
        });
        
        test('crossfading scenes', () => {
            return new Promise((resolve, reject) => {
                const stage = createStage(createDom(container));
                stage([
                    { type: 'image', url: 'transparent-10.png' },
                    { type: 'sound', tracks: ['silence-10.ogg'] }
                ], 500);
                
                setTimeout(() => {
                    stage([
                        { type: 'image', url: 'transparent-10.png' },
                        { type: 'sound', tracks: ['silence-10.ogg'] }
                    ], 500);
                    
                    setTimeout(() => {
                        assertAbove(scenes()[0].style.opacity, 0.45);
                        assertBelow(scenes()[0].style.opacity, 0.55);
                        assertAbove(scenes()[1].style.opacity, 0.45);
                        assertBelow(scenes()[1].style.opacity, 0.55);
                        assertAbove(tracks()[0].volume, 0.45);
                        assertBelow(tracks()[0].volume, 0.55);
                        assertAbove(tracks()[1].volume, 0.45);
                        assertBelow(tracks()[1].volume, 0.55);
                        assert(!tracks()[0].paused);
                        assert(!tracks()[1].paused);
                    }, 250);
                    
                    setTimeout(() => {
                        assertEqual(scenes().length, 1);
                        assertAbove(scenes()[0].style.opacity, 0.99);
                        assertEqual(tracks()[0].volume, 1);
                        assert(!tracks()[0].paused);
                        resolve();
                    }, 750);
                }, 750);
            });
        });
    });
};
