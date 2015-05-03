'use strict';

suite('ambience', function() {
	var assert = chai.assert;
	var assertEqual = chai.assert.deepEqual;
	var assertError = chai.assert.throws;
	
	var ambience = window.ambience;
	var stage;
	
	var fixture = {
		image: function() {
			return { type: 'image', url: 'http://example/' };
		},
		sound: function() {
			return { type: 'sound', tracks: ['http://example/'] };
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
	
	suite('interface', function() {
		// items and scene attributes required
	});
	
	suite('stage', function() {
		setup(function() {
			stage = document.createElement('div');
			// Append the stage to the document so that `getComputedStyle` works
			// as expected.
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
	
	suite('sound', function() {
		var scene;
		var tracks;
		var audio;
		// The `tick` below is updated whenever a new track starts and the tests
		// below always use the latest one.
		var tick;
		
		setup(function() {
			scene = document.createElement('div');
			tracks = [];
			audio = {
				start: function(url, newTick) {
					tick = newTick;
					tracks.push(url);
					return {
						duration: function() {
							return 1;
						}
					};
				}
			};
		});
		
		test('no tracks', function() {
			assertError(function() {
				ambience.start.sound({
					tracks: []
				}, scene, { audio: audio });
			});
		});
		
		test('single track, loop', function() {
			ambience.start.sound({
				tracks: ['test'],
				loop: true
			}, scene, { audio: audio });
			tick(1);
			
			assertEqual(tracks, ['test', 'test']);
		});
		
		test('single track, no loop', function() {
			ambience.start.sound({
				tracks: ['test'],
				loop: false
			}, scene, { audio: audio });
			tick(1);
			
			assertEqual(tracks, ['test']);
		});
		
		test('two tracks, loop', function() {
			ambience.start.sound({
				tracks: ['one', 'two'],
				loop: true
			}, scene, { audio: audio });
			tick(1);
			tick(1);
			tick(1);
			
			assertEqual(tracks, ['one', 'two', 'one', 'two']);
		});
		
		test('two tracks, no loop', function() {
			ambience.start.sound({
				tracks: ['one', 'two'],
				loop: false
			}, scene, { audio: audio });
			tick(1);
			tick(1);
			tick(1);
			
			assertEqual(tracks, ['one', 'two']);
		});
		
		// Just testing with two tracks misses error of the type "first track is
		// always played, second is scheduled right afterwards, but the third
		// one is scheduled later and using a different method and thus fails",
		// so we try with three tracks to be on the safe side.
		test('three tracks, loop', function() {
			ambience.start.sound({
				tracks: ['one', 'two', 'three'],
				loop: true
			}, scene, { audio: audio });
			tick(1);
			tick(1);
			tick(1);
			tick(1);
			tick(1);
			
			assertEqual(tracks, ['one', 'two', 'three', 'one', 'two', 'three']);
		});
		
		test('three tracks, no loop', function() {
			ambience.start.sound({
				tracks: ['one', 'two', 'three'],
				loop: false
			}, scene, { audio: audio });
			tick(1);
			tick(1);
			tick(1);
			
			assertEqual(tracks, ['one', 'two', 'three']);
		});
		
		test('single track, loop, overlap', function() {
			ambience.start.sound({
				tracks: ['test'],
				loop: true,
				overlap: 0.2
			}, scene, { audio: audio });
			tick(0.8);
			
			assertEqual(tracks, ['test', 'test']);
		});
		
		test('single track, no loop, overlap', function() {
			ambience.start.sound({
				tracks: ['test'],
				loop: false,
				overlap: 0.2
			}, scene, { audio: audio });
			tick(0.8);
			
			assertEqual(tracks, ['test']);
		});
		
		test('single overlap regardless of number of ticks', function() {
			var firstTick = ambience.start.sound({
				tracks: ['one'],
				loop: true,
				overlap: 0.2
			}, scene, { audio: audio });
			firstTick(0.81);
			firstTick(0.82);
			firstTick(0.83);
			
			assertEqual(tracks, ['one', 'one']);
		});
		
		test('single track, no loop, shuffle', function() {
			ambience.start.sound({
				tracks: ['test'],
				loop: false,
				shuffle: true
			}, scene, { audio: audio });
			
			tick(1);
			assertEqual(tracks, ['test']);
		});
		
		test('single track, loop, shuffle', function() {
			ambience.start.sound({
				tracks: ['test'],
				loop: true,
				shuffle: true
			}, scene, { audio: audio });
			
			tick(1);
			assertEqual(tracks, ['test', 'test']);
		});
		
		test('two tracks, no loop, shuffle', function() {
			ambience.start.sound({
				tracks: ['one', 'two'],
				loop: false,
				shuffle: true
			}, scene, { audio: audio, shuffle: constant(['two', 'one']) });
			
			tick(1);
			assertEqual(tracks, ['two', 'one']);
		});
		
		test('two tracks, loop, shuffle', function() {
			ambience.start.sound({
				tracks: ['one', 'two'],
				loop: false,
				shuffle: true
			}, scene, { audio: audio, shuffle: constant(['two', 'one']) });
			
			tick(1);
			assertEqual(tracks, ['two', 'one']);
		});
		
		test('two tracks, loop, shuffle twice', function() {
			var shuffleCount = 0;
			var shuffle = function() {
				shuffleCount += 1;
				if ( shuffleCount === 1 ) {
					return ['two', 'one'];
				}
				else if ( shuffleCount === 2 ) {
					return ['one', 'two'];
				}
				else {
					throw new Error('Tracks shuffled too many times.');
				}
			};
			
			ambience.start.sound({
				tracks: ['one', 'two'],
				loop: true,
				shuffle: true
			}, scene, { audio: audio, shuffle: shuffle });
			
			tick(1);
			tick(1);
			tick(1);
			assertEqual(tracks, ['two', 'one', 'one', 'two']);
		});
		
		function constant(value) {
			return function() {
				return value;
			};
		}
	});
});
