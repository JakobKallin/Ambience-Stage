'use strict';

suite('ambience', function() {
	var ambience = window.ambience;
	var stage;
	
	var fixture = {
		image: function() {
			return { type: 'image', url: 'http://example/' };
		},
		sound: function() {
			return { type: 'sound', url: 'http://example/' };
		}
	};
	
	function style(element) {
		return getComputedStyle(element);
	}
	
	function isOpaque(element) {
		// Note that the we don't check for exactly 1.0 opacity, because that
		// can cause some undesirable text rendering issues due to completely
		// opaque text using a different rendering method.
		return opacity(element) >= 0.99;
	}
	
	function isTransparent(element) {
		return opacity(element) === 0;
	}
	
	function opacity(element) {
		return parseFloat(style(element).opacity);
	}
	
	function query(element, expression) {
		return element.querySelector(expression);
	}
	
	function assert(expression) {
		if ( expression === false ) {
			throw new Error('Assertion failed');
		}
	}
	
	suite('stage', function() {
		setup(function() {
			stage = document.createElement('div');
			// Append the stage to the document so that `getComputedStyle` works as
			// expected.
			document.body.appendChild(stage);
		});
		
		teardown(function() {
			stage.remove();
		});
		
		// test('start empty scene', function() {
		// 	ambience.start([], stage);
		// 	assert(stage.children.length === 0);
		// });
		
		// test('stop empty scene', function() {
		// 	ambience.start([], stage);
		// 	ambience.stop(stage);
		// 	assert(stage.children.length === 0);
		// });
		
		test('start scene', function() {
			ambience.start([fixture.image()], stage);
			assert(stage.children.length === 1);
		});
		
		test('stop scene', function() {
			ambience.start([fixture.image()], stage);
			ambience.stop(stage);
			assert(stage.children.length === 0);
		});
		
		suite('fade in scene', function() {
			suite('visually', function() {
				test('beginning', function() {
					ambience.start([fixture.image()], stage, 1000);
					assert(opacity(stage.children[0]) === 0);
				});
				
				test('middle', function() {
					var update = ambience.start([fixture.image()], stage, 1000);
					update(500);
					assert(opacity(stage.children[0]) === 0.5);
				});
				
				test('end', function() {
					var update = ambience.start([fixture.image()], stage, 1000);
					update(1000);
					assert(isOpaque(stage.children[0]));
				});
				
				test('after', function() {
					var update = ambience.start([fixture.image()], stage, 1000);
					update(1500);
					assert(isOpaque(stage.children[0]));
				});
			});
			
			suite('aurally', function() {
				test('beginning', function() {
					ambience.start([fixture.sound()], stage, 1000);
					assert(query(stage, '.sound').volume === 0);
				});
				
				test('middle', function() {
					var update = ambience.start([fixture.sound()], stage, 1000);
					update(500);
					assert(query(stage, '.sound').volume === 0.5);
				});
				
				test('end', function() {
					var update = ambience.start([fixture.sound()], stage, 1000);
					update(1000);
					assert(query(stage, '.sound').volume === 1);
				});
				
				test('after', function() {
					var update = ambience.start([fixture.sound()], stage, 1000);
					update(1500);
					assert(query(stage, '.sound').volume === 1);
				});
			});
		});
		
		suite('fade out scene', function() {
			suite('visually', function() {
				test('beginning', function() {
					ambience.start([fixture.image()], stage);
					ambience.stop(stage, 1000);
					assert(isOpaque(stage.children[0]));
				});
				
				test('middle', function() {
					ambience.start([fixture.image()], stage);
					var update = ambience.stop(stage, 1000);
					update(500);
					assert(opacity(stage.children[0]) === 0.5);
				});
				
				test('end', function() {
					ambience.start([fixture.image()], stage);
					var update = ambience.stop(stage, 1000);
					update(1000);
					assert(stage.children.length === 0);
				});
			});
			
			suite('aurally', function() {
				test('beginning', function() {
					ambience.start([fixture.sound()], stage);
					ambience.stop(stage, 1000);
					assert(query(stage, '.sound').volume === 1);
				});
				
				test('middle', function() {
					ambience.start([fixture.sound()], stage);
					var update = ambience.stop(stage, 1000);
					update(500);
					assert(query(stage, '.sound').volume === 0.5);
				});
				
				test('end', function() {
					ambience.start([fixture.sound()], stage);
					var update = ambience.stop(stage, 1000);
					update(1000);
					assert(stage.children.length === 0);
				});
			});
		});
		
		// The tests below only check for visual fading. We assume that aural fading
		// also works in this situation if the separate aural fading tests have
		// passed.
		suite('replace scene', function() {
			test('without fading', function() {
				ambience.start([{ type: 'image', url: 'http://one.example/' }], stage);
				ambience.start([{ type: 'image', url: 'http://two.example/' }], stage);
				
				assert(stage.children.length === 1);
				assert(style(query(stage, '.image')).backgroundImage === 'url(http://two.example/)');
			});
			
			test('with fading, beginning', function() {
				ambience.start([{ type: 'image', url: 'http://one.example/' }], stage);
				ambience.start([{ type: 'image', url: 'http://two.example/' }], stage, 1000);
				
				assert(isOpaque(stage.children[0]))
				assert(isTransparent(stage.children[1]));
			});
			
			test('with fading, middle', function() {
				ambience.start([{ type: 'image', url: 'http://one.example/' }], stage);
				var update = ambience.start([{ type: 'image', url: 'http://two.example/' }], stage, 1000);
				update(500);
				
				assert(opacity(stage.children[0]) === 0.5);
				assert(opacity(stage.children[1]) === 0.5);
			});
			
			test('with fading, end', function() {
				ambience.start([{ type: 'image', url: 'http://one.example/' }], stage);
				var update = ambience.start([{ type: 'image', url: 'http://two.example/' }], stage, 1000);
				update(1000);
				
				assert(stage.children.length === 1);
				assert(isOpaque(stage.children[0]));
			});
		});
	});
});
