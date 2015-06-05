'use strict';

suite('ambience', function() {
	var assert = chai.assert;
	var assertEqual = chai.assert.deepEqual;
	var assertError = chai.assert.throws;
	
	var ambience = window.ambience;
	
	function collect(target) {
		return function(value) {
			target.push(value);
		};
	}
	
	function extend(object, newProperty, value) {
		var newObject = {};
		for ( var property in object ) {
			newObject[property] = object[property];
		}
		newObject[newProperty] = value;
		return newObject;
	}
	
	function nothing() {}
	
	function statefulStage(callbacks) {
		var handle = ambience(callbacks);
		
		return {
			start: start,
			stop: stop,
			update: update
		};
		
		function start(items, fade) {
			handle = handle.start(items, fade);
		}
		
		function stop(fade) {
			start([], fade);
		}
		
		function update(increase) {
			handle.update(increase);
		}
	}
	
	suite('scene', function() {
		var started;
		var stopped;
		var fadeIn;
		var fadeOut;
		var stage;
		
		setup(function() {
			started = [];
			stopped = [];
			fadeIn = [];
			fadeOut = [];
			
			var callbacks = {
				start: {
					image: function(image) {
						started.push(image.url);
						return function stop() {
							stopped.push(image.url);
						};
					}
				},
				fade: {
					in: collect(fadeIn),
					out: collect(fadeOut)
				}
			};
			
			stage = statefulStage(callbacks);
		});
		
		test('start scene', function() {
			stage.start([{ type: 'image', url: 'image' }]);
			
			assertEqual(started, ['image']);
		});
		
		test('stop scene', function() {
			stage.start([{ type: 'image', url: 'image' }]);
			stage.stop();
			
			// One indirectly from calling `start`, one directly from calling `stop`.
			assertEqual(stopped, ['image']);
		});
		
		test('fade in, before', function() {
			stage.start([], 1000);
			
			assertEqual(fadeIn, []);
		});
		
		test('fade in, beginning', function() {
			stage.start([], 1000);
			stage.update(0);
			
			assertEqual(fadeIn, [0]);
		});
		
		test('fade in, middle', function() {
			stage.start([], 1000);
			stage.update(500);
			
			assertEqual(fadeIn, [0.5]);
		});
		
		test('fade in, end', function() {
			stage.start([], 1000);
			stage.update(1000);
			
			assertEqual(fadeIn, [1]);
		});
		
		test('fade in, after', function() {
			stage.start([], 1000);
			stage.update(1500);
			
			assertEqual(fadeIn, [1]);
		});
		
		test('fade out, before', function() {
			stage.start([]);
			stage.stop(1000);
			
			assertEqual(fadeOut, []);
		});
		
		test('fade out, beginning', function() {
			stage.start([]);
			stage.stop(1000);
			stage.update(0);
			
			assertEqual(fadeOut, [1]);
		});
		
		test('fade out, middle', function() {
			stage.start([]);
			stage.stop(1000);
			stage.update(500);
			
			assertEqual(fadeOut, [0.5]);
		});
		
		test('fade out, end', function() {
			stage.start([{ type: 'image', url: 'image' }]);
			stage.stop(1000);
			stage.update(1000);
			
			assertEqual(fadeOut, [0]);
			assertEqual(stopped, ['image']);
		});
		
		test('fade out, after', function() {
			stage.start([{ type: 'image', url: 'image' }]);
			stage.stop(1000);
			stage.update(1500);
			
			assertEqual(fadeOut, [0]);
			assertEqual(stopped, ['image']);
		});
		
		test('fade in twice, middle', function() {
			stage.start([{ type: 'image', url: 'image' }], 1000);
			stage.update(1500);
			stage.start([{ type: 'image', url: 'image' }], 1000);
			stage.update(500);
			
			assertEqual(fadeIn, [1, 0.5]);
		});
		
		test('replace scene, without fading', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			stage.start([{ type: 'image', url: 'image/2' }]);
			
			assertEqual(started, ['image/1', 'image/2'])
			assertEqual(stopped, ['image/1']);
		});
		
		test('replace scene, with fading, before', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			stage.start([{ type: 'image', url: 'image/2' }], 1000);
			
			assertEqual(fadeOut, []);
			assertEqual(fadeIn, []);
		});
		
		test('replace scene, with fading, beginning', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			stage.start([{ type: 'image', url: 'image/2' }], 1000);
			stage.update(0);
			
			assertEqual(fadeOut, [1]);
			assertEqual(fadeIn, [0]);
		});
		
		test('replace scene, with fading, middle', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			stage.start([{ type: 'image', url: 'image/2' }], 1000);
			stage.update(500);
			
			assertEqual(fadeOut, [0.5]);
			assertEqual(fadeIn, [0.5]);
		});
		
		test('replace scene, with fading, end', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			stage.start([{ type: 'image', url: 'image/2' }], 1000);
			stage.update(1000);
			
			assertEqual(fadeOut, [0]);
			assertEqual(fadeIn, [1]);
			assertEqual(stopped, ['image/1']);
		});
		
		test('replace scene, with fading, after', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			stage.start([{ type: 'image', url: 'image/2' }], 1000);
			stage.update(1500);
			
			assertEqual(fadeOut, [0]);
			assertEqual(fadeIn, [1]);
			assertEqual(stopped, ['image/1']);
		});
		
		test('multiple media, start', function() {
			stage.start([
				{ type: 'image', url: 'image/1' },
				{ type: 'image', url: 'image/2' }
			]);
			
			assertEqual(started, ['image/1', 'image/2']);
		});
		
		test('multiple media, stop', function() {
			stage.start([
				{ type: 'image', url: 'image/1' },
				{ type: 'image', url: 'image/2' }
			]);
			stage.stop();
			
			assertEqual(stopped, ['image/1', 'image/2']);
		});
	});
	
	suite('sound', function() {
		var started;
		var stopped;
		// The `tick` below is updated whenever a new track starts and the tests
		// below always use the latest one.
		var tick;
		var start;
		var stop;
		var defaultStage;
		var defaultCallbacks;
		
		setup(function() {
			started = [];
			stopped = [];
			defaultCallbacks = {
				start: {
					track: function(url) {
						started.push(url);
						return {
							stop: function() {
							    stopped.push(url);
							},
							duration: function() {
								return 1;
							}
						};
					}
				},
				fade: {
					in: nothing,
					out: nothing
				}
			};
			defaultStage = function() {
				return statefulStage(defaultCallbacks);
			};
		});
		
		test('no tracks', function() {
			assertError(function() {
				var stage = defaultStage();
				stage.start([{
					type: 'sound',
					tracks: []
				}]);
			});
		});
		
		test('single track', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['test']
			}]);
			stage.update(0);
			
			assertEqual(started, ['test']);
		});
		
		test('single track, loop', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['test'],
				loop: true
			}]);
			stage.update(0);
			stage.update(1);
			
			assertEqual(started, ['test', 'test']);
		});
		
		test('single track, no loop', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['test'],
				loop: false
			}]);
			stage.update(0);
			stage.update(1);
			
			assertEqual(started, ['test']);
		});
		
		test('two tracks, loop', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: true
			}]);
			stage.update(0);
			stage.update(1);
			stage.update(1);
			stage.update(1);
			
			assertEqual(started, ['one', 'two', 'one', 'two']);
		});
		
		test('two tracks, no loop', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: false
			}]);
			stage.update(0);
			stage.update(1);
			stage.update(1);
			stage.update(1);
			
			assertEqual(started, ['one', 'two']);
		});
		
		// Just testing with two tracks misses error of the type "first track is
		// always played, second is scheduled right afterwards, but the third
		// one is scheduled later and using a different method and thus fails",
		// so we try with three tracks to be on the safe side.
		test('three tracks, loop', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two', 'three'],
				loop: true
			}]);
			stage.update(0);
			stage.update(1);
			stage.update(1);
			stage.update(1);
			stage.update(1);
			stage.update(1);
			
			assertEqual(started, ['one', 'two', 'three', 'one', 'two', 'three']);
		});
		
		test('three tracks, no loop', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two', 'three'],
				loop: false
			}]);
			stage.update(0);
			stage.update(1);
			stage.update(1);
			stage.update(1);
			
			assertEqual(started, ['one', 'two', 'three']);
		});
		
		test('single track, loop, overlap', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['test'],
				loop: true,
				overlap: 0.2
			}]);
			stage.update(0);
			stage.update(0.8);
			
			assertEqual(started, ['test', 'test']);
		});
		
		test('single track, no loop, overlap', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['test'],
				loop: false,
				overlap: 0.2
			}]);
			stage.update(0);
			stage.update(0.8);
			
			assertEqual(started, ['test']);
		});
		
		test('single overlap regardless of number of ticks', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one'],
				loop: true,
				overlap: 0.2
			}]);
			stage.update(0);
			stage.update(0.81);
			stage.update(0.01);
			stage.update(0.01);
			
			assertEqual(started, ['one', 'one']);
		});
		
		test('track stops even when ticked higher than duration', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one'],
				loop: false
			}]);
			stage.update(0);
			stage.update(1.1);
			
			assertEqual(stopped, ['one']);
		});
		
		test('single track, no loop, shuffle', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['test'],
				loop: false,
				shuffle: true
			}]);
			stage.update(0);
			stage.update(1);
			
			assertEqual(started, ['test']);
		});
		
		test('single track, loop, shuffle', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['test'],
				loop: true,
				shuffle: true
			}]);
			stage.update(0);
			stage.update(1);
			
			assertEqual(started, ['test', 'test']);
		});
		
		test('two tracks, no loop, shuffle', function() {
			var callbacks = extend(
				defaultCallbacks,
				'shuffle',
				constant(['two', 'one'])
			);
			var stage = statefulStage(callbacks);
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: false,
				shuffle: true
			}]);
			stage.update(0);
			stage.update(1);
			
			assertEqual(started, ['two', 'one']);
		});
		
		test('two tracks, loop, shuffle', function() {
			var callbacks = extend(
				defaultCallbacks,
				'shuffle',
				constant(['two', 'one'])
			);
			var stage = statefulStage(callbacks);
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: true,
				shuffle: true
			}]);
			stage.update(0);
			stage.update(1);
			
			assertEqual(started, ['two', 'one']);
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
			var callbacks = extend(defaultCallbacks, 'shuffle', shuffle);
			var stage = statefulStage(callbacks);
			
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: true,
				shuffle: true
			}]);
			stage.update(0);
			stage.update(1);
			stage.update(1);
			stage.update(1);
			
			assertEqual(started, ['two', 'one', 'one', 'two']);
		});
		
		test('multiple tracklists, different overlap', function() {
			var stage = defaultStage();
			stage.start([
				{
					type: 'sound',
					tracks: ['one'],
					overlap: 0.2,
					loop: true
				},
				{
					type: 'sound',
					tracks: ['two'],
					overlap: 0.5,
					loop: true
				}
			]);
			stage.update(0);
			stage.update(0.5);
			stage.update(0.3);
			
			assertEqual(started, ['one', 'two', 'two', 'one']);
		});
		
		test('track plays during overlap', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two'],
				overlap: 0.2
			}])
			stage.update(0);
			stage.update(0.8);
			stage.update(0.1);
			
			assertEqual(started, ['one', 'two']);
			assertEqual(stopped, []);
		});
		
		test('track stops after overlap', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one', 'two'],
				overlap: 0.2
			}])
			stage.update(0);
			stage.update(0.8);
			stage.update(0.2);
			
			assertEqual(started, ['one', 'two']);
			assertEqual(stopped, ['one']);
		});
		
		test('last track stops', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one']
			}])
			stage.update(0);
			stage.update(1);
			
			assertEqual(stopped, ['one']);
		});
		
		test('last track stops, loop', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound',
				tracks: ['one'],
				loop: true
			}])
			stage.update(0);
			stage.update(1);
			
			assertEqual(stopped, ['one']);
		});
		
		function constant(value) {
			return function() {
				return value;
			};
		}
	});
});
