'use strict';

suite('Ambience DOM', function() {
	var assert = chai.assert;
	var assertEqual = chai.assert.deepEqual;
	var assertAbove = chai.assert.isAbove;
	var assertBelow = chai.assert.isBelow;
	chai.config.truncateThreshold = 0;
	
	var dom = window.ambience.dom;
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
		function withoutUrl(value) {
			return value.replace(/^url\(('|")?/g, '').replace(/('|")?\)$/g, '');
		}
		
		function absolute(url) {
			return location.href + url;
		}
		
		test('start', function() {
	    	start.image({ url: 'transparent-10.png' });
			
			assertEqual(container.children.length, 1);
			assertEqual(
				withoutUrl(container.children[0].style.backgroundImage),
				absolute('transparent-10.png')
			);
		});
		
		test('stop', function() {
	    	var handle = start.image({ url: 'transparent-10.png' });
			handle.stop();
			
			assertEqual(container.children.length, 0);
		});
		
		test('stop one of many', function() {
	    	var first = start.image({ url: 'transparent-10.png#1' });
	    	var second = start.image({ url: 'transparent-10.png#2' });
	    	var third = start.image({ url: 'transparent-10.png#3' });
			second.stop();
			
			assertEqual(container.children.length, 2);
			assertEqual(
				withoutUrl(container.children[0].style.backgroundImage),
				absolute('transparent-10.png#1')
			);
			assertEqual(
				withoutUrl(container.children[1].style.backgroundImage),
				absolute('transparent-10.png#3')
			);
		});
		
		test('style', function() {
		    start.image({
				url: 'transparent-10.png',
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
	});
});
