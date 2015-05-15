'use strict';

suite('ambience', function() {
	var assert = chai.assert;
	var assertEqual = chai.assert.deepEqual;
	var assertError = chai.assert.throws;
	
	var ambience = window.ambience;
	
	var fixture = {
		image: function() {
			return { type: 'image', url: 'image' };
		},
		sound: function() {
			return { type: 'sound', tracks: ['example/sound'] };
		}
	};
	
	function collect(target) {
		return function(value) {
			target.push(value);
		};
	}
	
	function chain(f1, f2) {
		return function(x) {
			return f2(f1(x));
		};
	}
	
	function extract(property) {
		return function(object) {
			return object[property];
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
	
	suite('helpers', function() {
		test('chain extract and collect', function() {
			var urls = [];
			var composite = chain(extract('url'), collect(urls));
			composite({ url: 'test' });
			assertEqual(urls, ['test']);
		});
	});
	
	suite('scene', function() {
		var started;
		var stopped;
		var fadeIn;
		var fadeOut;
		var stage;
		
		setup(function() {
			started = 0;
			stopped = 0;
			fadeIn = [];
			fadeOut = [];
			
			var callbacks = {
				start: { image: function() { started += 1; } },
				stop: { image: function() { stopped += 1; } },
				fade: {
					in: collect(fadeIn),
					out: collect(fadeOut)
				}
			};
			
			stage = ambience(callbacks);
		});
		
		test('start scene', function() {
			stage.start([fixture.image()]);
			
			assertEqual(started, 1);
		});
		
		test('stop scene', function() {
			stage.start([fixture.image()]);
			stage.stop();
			
			// One indirectly from calling `start`, one directly from calling `stop`.
			assertEqual(stopped, 2);
		});
		
		test('fade in, before', function() {
			var update = stage.start([], 1000);
			
			assertEqual(fadeIn, []);
		});
		
		test('fade in, beginning', function() {
			var update = stage.start([], 1000);
			update(0);
			
			assertEqual(fadeIn, [0]);
		});
		
		test('fade in, middle', function() {
			var update = stage.start([], 1000);
			update(500);
			
			assertEqual(fadeIn, [0.5]);
		});
		
		test('fade in, end', function() {
			var update = stage.start([], 1000);
			update(1000);
			
			assertEqual(fadeIn, [1]);
		});
		
		test('fade in, after', function() {
			var update = stage.start([], 1000);
			update(1500);
			
			assertEqual(fadeIn, [1]);
		});
		
		test('fade out, before', function() {
			stage.start([]);
			stage.stop(1000);
			
			assertEqual(fadeOut, []);
		});
		
		test('fade out, beginning', function() {
			stage.start([]);
			var update = stage.stop(1000);
			update(0);
			
			assertEqual(fadeOut, [1]);
		});
		
		test('fade out, middle', function() {
			stage.start([]);
			var update = stage.stop(1000);
			update(500);
			
			assertEqual(fadeOut, [0.5]);
		});
		
		test('fade out, end', function() {
			stage.start([]);
			var update = stage.stop(1000);
			update(1000);
			
			assertEqual(fadeOut, [0]);
			assertEqual(stopped, 2);
		});
		
		test('fade out, after', function() {
			stage.start([]);
			var update = stage.stop(1000);
			update(1500);
			
			assertEqual(fadeOut, [0]);
			assertEqual(stopped, 2);
		});
		
		test('replace scene, without fading', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			stage.start([{ type: 'image', url: 'image/2' }]);
			
			assertEqual(started, 2)
			assertEqual(stopped, 2);
		});
		
		test('replace scene, with fading, before', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			stage.start([{ type: 'image', url: 'image/2' }], 1000);
			
			assertEqual(fadeOut, []);
			assertEqual(fadeIn, []);
		});
		
		test('replace scene, with fading, beginning', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			var update = stage.start([{ type: 'image', url: 'image/2' }], 1000);
			update(0);
			
			assertEqual(fadeOut, [1]);
			assertEqual(fadeIn, [0]);
		});
		
		test('replace scene, with fading, middle', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			var update = stage.start([{ type: 'image', url: 'image/2' }], 1000);
			update(500);
			
			assertEqual(fadeOut, [0.5]);
			assertEqual(fadeIn, [0.5]);
		});
		
		test('replace scene, with fading, end', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			var update = stage.start([{ type: 'image', url: 'image/2' }], 1000);
			update(1000);
			
			assertEqual(fadeOut, [0]);
			assertEqual(fadeIn, [1]);
			assertEqual(stopped, 2);
		});
		
		test('replace scene, with fading, after', function() {
			stage.start([{ type: 'image', url: 'image/1' }]);
			var update = stage.start([{ type: 'image', url: 'image/2' }], 1000);
			update(1500);
			
			assertEqual(fadeOut, [0]);
			assertEqual(fadeIn, [1]);
			assertEqual(stopped, 2);
		});
	});
	
	suite('sound', function() {
		var tracks;
		// The `tick` below is updated whenever a new track starts and the tests
		// below always use the latest one.
		var tick;
		var start;
		var stop;
		var defaultStage;
		var defaultCallbacks;
		
		setup(function() {
			tracks = [];
			defaultCallbacks = {
				start: {
					track: function(url, newTick) {
						tick = newTick;
						tracks.push(url);
						return {
							duration: function() {
								return 1;
							}
						};
					}
				},
				stop: {
					track: function() {},
					image: function() {}
				}
			};
			defaultStage = function() {
				return ambience(defaultCallbacks);
			};
		});
		
		test('no tracks', function() {
			assertError(function() {
				var stage = defaultStage();
				stage.start([{
					type: 'sound', tracks: []
				}]);
			});
		});
		
		test('single track, loop', function() {
			var stage = defaultStage();
			stage.start([{
				type: 'sound', tracks: ['test'],
				loop: true
			}]);
			tick(1);
			
			assertEqual(tracks, ['test', 'test']);
		});
		
		test('single track, no loop', function() {
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['test'], loop: false }]);
			tick(1);
			
			assertEqual(tracks, ['test']);
		});
		
		test('two tracks, loop', function() {
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['one', 'two'], loop: true }]);
			tick(1);
			tick(1);
			tick(1);
			
			assertEqual(tracks, ['one', 'two', 'one', 'two']);
		});
		
		test('two tracks, no loop', function() {
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['one', 'two'], loop: false }]);
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
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['one', 'two', 'three'], loop: true }]);
			tick(1);
			tick(1);
			tick(1);
			tick(1);
			tick(1);
			
			assertEqual(tracks, ['one', 'two', 'three', 'one', 'two', 'three']);
		});
		
		test('three tracks, no loop', function() {
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['one', 'two', 'three'], loop: false }]);
			tick(1);
			tick(1);
			tick(1);
			
			assertEqual(tracks, ['one', 'two', 'three']);
		});
		
		test('single track, loop, overlap', function() {
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['test'], loop: true, overlap: 0.2 }]);
			tick(0.8);
			
			assertEqual(tracks, ['test', 'test']);
		});
		
		test('single track, no loop, overlap', function() {
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['test'], loop: false, overlap: 0.2 }]);
			tick(0.8);
			
			assertEqual(tracks, ['test']);
		});
		
		test('single overlap regardless of number of ticks', function() {
			var stage = defaultStage();
			var firstTick = stage.start([{ type: 'sound', tracks: ['one'], loop: true, overlap: 0.2 }]);
			firstTick(0.81);
			firstTick(0.82);
			firstTick(0.83);
			
			assertEqual(tracks, ['one', 'one']);
		});
		
		test('single track, no loop, shuffle', function() {
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['test'], loop: false, shuffle: true }]);
			
			tick(1);
			assertEqual(tracks, ['test']);
		});
		
		test('single track, loop, shuffle', function() {
			var stage = defaultStage();
			stage.start([{ type: 'sound', tracks: ['test'], loop: true, shuffle: true }]);
			
			tick(1);
			assertEqual(tracks, ['test', 'test']);
		});
		
		test('two tracks, no loop, shuffle', function() {
			var callbacks = extend(
				defaultStage(),
				'shuffle',
				constant(['two', 'one'])
			);
			var stage = ambience(callbacks);
			stage.start([{ type: 'sound', tracks: ['one', 'two'], loop: false, shuffle: true }]);
			
			tick(1);
			assertEqual(tracks, ['two', 'one']);
		});
		
		test('two tracks, loop, shuffle', function() {
			var callbacks = extend(
				defaultStage(),
				'shuffle',
				constant(['two', 'one'])
			);
			var stage = ambience.callbacks();
			stage.start([{ type: 'sound', tracks: ['one', 'two'], loop: true, shuffle: true }]);
			
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
			var callbacks = extend(defaultStage(), 'shuffle', shuffle);
			var stage = ambience(callbacks);
			
			stage.start([{ type: 'sound', tracks: ['one', 'two'], loop: true, shuffle: true }]);
			
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
