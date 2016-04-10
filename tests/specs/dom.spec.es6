import dom from '../../source/dom.js'

export default function() {
    var assert = chai.assert;
    var assertEqual = chai.assert.deepEqual;
    var assertAbove = chai.assert.isAbove;
    var assertBelow = chai.assert.isBelow;
    
    var container;
    var start;
    
    setup(function() {
        container = document.createElement('div');
        start = dom(container);
    });
    
    suite('scene', function() {
        test('fade transparent', function() {
            var handle = start.scene();
            handle.fade(0);
            
            assertEqual(parseFloat(container.style.opacity), 0);
        });
        
        test('fade semi-transparent', function() {
            var handle = start.scene();
            handle.fade(0.5);
            
            assertEqual(parseFloat(container.style.opacity), 0.5);
        });
        
        test('fade opaque', function() {
            var handle = start.scene();
            handle.fade(1);
            
            // We don't want to set opacity to exactly one because that might 
            // change the rendering method for text and introduce a noticeable 
            // "jump" visually.
            var opacity = parseFloat(container.style.opacity);
            assertAbove(opacity, 0.99);
            assertBelow(opacity, 1);
        });
    });
    
    suite('image', function() {
        // Remove the "url('...')" part from CSS values because we cannot 
        // predict whether they will have quotes or not, and of what kind.
        function withoutUrl(value) {
            return value.replace(/^url\(('|")?/g, '').replace(/('|")?\)$/g, '');
        }
        
        // Use absolute URLs because browsers seem to treat relative URLs in 
        // different ways, sometimes converting to absolute and sometimes not.
        function url(path) {
            return location.href + path;
        }
        
        test('start', function() {
            start.image({ url: url('transparent-10.png') });
            
            assertEqual(container.children.length, 1);
            assertEqual(
                withoutUrl(container.children[0].style.backgroundImage),
                url('transparent-10.png')
            );
        });
        
        test('stop', function() {
            var handle = start.image({ url: url('transparent-10.png') });
            handle.stop();
            
            assertEqual(container.children.length, 0);
        });
        
        test('stop one of many', function() {
            var first = start.image({ url: url('transparent-10.png#1') });
            var second = start.image({ url: url('transparent-10.png#2') });
            var third = start.image({ url: url('transparent-10.png#3') });
            second.stop();
            
            assertEqual(container.children.length, 2);
            assertEqual(
                withoutUrl(container.children[0].style.backgroundImage),
                url('transparent-10.png#1')
            );
            assertEqual(
                withoutUrl(container.children[1].style.backgroundImage),
                url('transparent-10.png#3')
            );
        });
        
        test('style', function() {
            start.image({
                url: url('transparent-10.png'),
                style: {
                    backgroundSize: 'cover'
                }
            });
            
            assertEqual(container.children[0].style.backgroundSize, 'cover');
        });
    });
    
    suite('track', function() {
        test('start', function() {
            start.track('silence-1.ogg');
            var element = container.children[0];
            
            assertEqual(container.children.length, 1);
            assertEqual(element.getAttribute('src'), 'silence-1.ogg');
            assertEqual(element.paused, false);
        });
        
        test('stop', function() {
            var handle = start.track('silence-1.ogg');
            var element = container.children[0];
            handle.stop();
            
            assertEqual(container.children.length, 0);
            assertEqual(element.paused, true);
        });
        
        test('stop one of many', function() {
            var first = start.track('silence-1.ogg#1');
            var second = start.track('silence-1.ogg#2');
            var third = start.track('silence-1.ogg#3');
            var element = container.children[1];
            second.stop();
            
            assertEqual(container.children.length, 2);
            assertEqual(
                container.children[0].getAttribute('src'),
                'silence-1.ogg#1'
            );
            assertEqual(
                container.children[1].getAttribute('src'),
                'silence-1.ogg#3'
            );
            assertEqual(element.paused, true);
        });
        
        test('fade transparent', function() {
            var handle = start.track('silence-1.ogg');
            handle.fade(0);
            
            assertEqual(container.children[0].volume, 0);
        });
        
        test('fade semi-transparent', function() {
            var handle = start.track('silence-1.ogg');
            handle.fade(0.5);
            
            assertEqual(container.children[0].volume, 0.5);
        });
        
        test('fade opaque', function() {
            var handle = start.track('silence-1.ogg');
            handle.fade(1);
            
            assertEqual(container.children[0].volume, 1);
        });
        
        test('update', function() {
            var updates = 0;
            var handle = start.track('silence-1.ogg', function() {
                updates += 1;
            });
            
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
            var latestUpdate;
            var handle = start.track('silence-1.ogg', function() {
                console.log(element.currentTime);
                latestUpdate = element.currentTime;
            });
            var element = container.children[0];
            
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    assertEqual(latestUpdate, element.duration);
                    resolve();
                }, 1500);
            });
        });
        
        test('duration', () => {
            const handle = start.track('silence-1.ogg', function() {});
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const duration = handle.duration();
                    // Allow for some leeway in case the browser does not
                    // consider the file *exactly* one second long.
                    assertAbove(duration, 0.9);
                    assertBelow(duration, 1.1);
                    resolve();
                }, 1500);
            });
        });
    });
};
