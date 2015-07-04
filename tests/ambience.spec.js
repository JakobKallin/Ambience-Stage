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
		var start = ambience(callbacks);
		
		return function(items, fade) {
			var nextStart = start(items, fade);
			start = nextStart;
		};
	}
	
	var time;
	var updateLatest;
	var advance;
	setup(function() {
		time = 0;
		updateLatest = nothing;
		advance = function(amount) {
			time += amount;
			updateLatest();
		}
	});
	
	suite('scene', function() {
		var started;
		var stopped;
		var fadeIn;
		var fadeOut;
		var start;
		var stop;
		
		setup(function() {
			started = [];
			stopped = [];
			fadeIn = [];
			fadeOut = [];
			
			var latestSceneIndex = -1;
			var callbacks = {
				start: {
					scene: function(update) {
					    updateLatest = update;
						var sceneIndex = latestSceneIndex + 1;
						started.push(sceneIndex);
						latestSceneIndex = sceneIndex;
						return function stop() {
							stopped.push(sceneIndex);
						};
					}
				},
				fade: {
					in: collect(fadeIn),
					out: collect(fadeOut)
				},
				time: function() {
				    return time;
				}
			};
			
			start = statefulStage(callbacks);
			stop = function(fade) {
			    start([], fade);
			};
		});
		
		test('start scene', function() {
			start([]);
			
			assertEqual(started, [0]);
		});
		
		test('stop scene', function() {
			start([]);
			stop();
			
			assertEqual(stopped, [0]);
		});
		
		test('fade in, before', function() {
			start([], 1000);
			
			assertEqual(fadeIn, []);
		});
		
		test('fade in, beginning', function() {
			start([], 1000);
			advance(0);
			
			assertEqual(fadeIn, [0]);
		});
		
		test('fade in, middle', function() {
			start([], 1000);
			advance(500);
			
			assertEqual(fadeIn, [0.5]);
		});
		
		test('fade in, end', function() {
			start([], 1000);
			advance(1000);
			
			assertEqual(fadeIn, [1]);
		});
		
		test('fade in, after', function() {
			start([], 1000);
			advance(1500);
			
			assertEqual(fadeIn, [1]);
		});
		
		test('fade out, before', function() {
			start([]);
			stop(1000);
			
			assertEqual(fadeOut, []);
		});
		
		test('fade out, beginning', function() {
			start([]);
			stop(1000);
			advance(0);
			
			assertEqual(fadeOut, [1]);
		});
		
		test('fade out, middle', function() {
			start([]);
			stop(1000);
			advance(500);
			
			assertEqual(fadeOut, [0.5]);
		});
		
		test('fade out, end', function() {
			start([]);
			stop(1000);
			advance(1000);
			
			assertEqual(fadeOut, [0]);
			assertEqual(stopped, [0]);
		});
		
		test('fade out, after', function() {
			start([]);
			stop(1000);
			advance(1500);
			
			assertEqual(fadeOut, [0]);
			assertEqual(stopped, [0]);
		});
		
		test('fade in twice, middle', function() {
			start([], 1000);
			advance(1500);
			start([], 1000);
			advance(500);
			
			assertEqual(fadeIn, [1, 0.5]);
		});
		
		test('replace scene, without fading', function() {
			start([]);
			start([]);
			
			assertEqual(started, [0, 1])
			assertEqual(stopped, [0]);
		});
		
		test('replace scene, with fading, before', function() {
			start([]);
			start([], 1000);
			
			assertEqual(fadeOut, []);
			assertEqual(fadeIn, []);
		});
		
		test('replace scene, with fading, beginning', function() {
			start([]);
			start([], 1000);
			advance(0);
			
			assertEqual(fadeOut, [1]);
			assertEqual(fadeIn, [0]);
		});
		
		test('replace scene, with fading, middle', function() {
			start([]);
			start([], 1000);
			advance(500);
			
			assertEqual(fadeOut, [0.5]);
			assertEqual(fadeIn, [0.5]);
		});
		
		test('replace scene, with fading, end', function() {
			start([]);
			start([], 1000);
			advance(1000);
			
			assertEqual(fadeOut, [0]);
			assertEqual(fadeIn, [1]);
			assertEqual(stopped, [0]);
		});
		
		test('replace scene, with fading, after', function() {
			start([]);
			start([], 1000);
			advance(1500);
			
			assertEqual(fadeOut, [0]);
			assertEqual(fadeIn, [1]);
			assertEqual(stopped, [0]);
		});
	});
	
	suite('multiple media', function() {
		var started;
		var stopped;
		var start;
		var stop;
		
		setup(function() {
			started = [];
			stopped = [];
			
			var callbacks = {
				start: {
					image: function(image, update) {
						updateLatest = update;
						started.push(image.url);
						return function stop() {
							stopped.push(image.url);
						};
					}
				},
				time: function() {
					return time;
				}
			};
			
			start = statefulStage(callbacks);
			stop = function(fade) {
			    return start([], fade);
			}
		});
		
		test('start', function() {
			start([
				{ type: 'image', url: 'image/1' },
				{ type: 'image', url: 'image/2' }
			]);
			
			assertEqual(started, ['image/1', 'image/2']);
		});
		
		test('stop', function() {
			start([
				{ type: 'image', url: 'image/1' },
				{ type: 'image', url: 'image/2' }
			]);
			stop();
			
			assertEqual(stopped, ['image/1', 'image/2']);
		});
	});
	
	suite('sound', function() {
		var started;
		var stopped;
		var defaultStage;
		var defaultCallbacks;
		
		setup(function() {
			started = [];
			stopped = [];
			defaultCallbacks = {
				start: {
					track: function(url, update) {
						updateLatest = update;
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
				},
				time: function() {
					return time;
				}
			};
			defaultStage = function() {
				return statefulStage(defaultCallbacks);
			};
		});
		
		test('no tracks', function() {
			assertError(function() {
				var start = defaultStage();
				start([{
					type: 'sound',
					tracks: []
				}]);
			});
		});
		
		test('single track', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['test']
			}]);
			advance(0);
			
			assertEqual(started, ['test']);
		});
		
		test('single track, loop', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['test'],
				loop: true
			}]);
			advance(0);
			advance(1);
			
			assertEqual(started, ['test', 'test']);
		});
		
		test('single track, no loop', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['test'],
				loop: false
			}]);
			advance(0);
			advance(1);
			
			assertEqual(started, ['test']);
		});
		
		test('two tracks, loop', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: true
			}]);
			advance(0);
			advance(1);
			advance(1);
			advance(1);
			
			assertEqual(started, ['one', 'two', 'one', 'two']);
		});
		
		test('two tracks, no loop', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: false
			}]);
			advance(0);
			advance(1);
			advance(1);
			advance(1);
			
			assertEqual(started, ['one', 'two']);
		});
		
		// Just testing with two tracks misses error of the type "first track is
		// always played, second is scheduled right afterwards, but the third
		// one is scheduled later and using a different method and thus fails",
		// so we try with three tracks to be on the safe side.
		test('three tracks, loop', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one', 'two', 'three'],
				loop: true
			}]);
			advance(0);
			advance(1);
			advance(1);
			advance(1);
			advance(1);
			advance(1);
			
			assertEqual(started, ['one', 'two', 'three', 'one', 'two', 'three']);
		});
		
		test('three tracks, no loop', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one', 'two', 'three'],
				loop: false
			}]);
			advance(0);
			advance(1);
			advance(1);
			advance(1);
			
			assertEqual(started, ['one', 'two', 'three']);
		});
		
		test('single track, loop, overlap', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['test'],
				loop: true,
				overlap: 0.2
			}]);
			advance(0);
			advance(0.8);
			
			assertEqual(started, ['test', 'test']);
		});
		
		test('single track, no loop, overlap', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['test'],
				loop: false,
				overlap: 0.2
			}]);
			advance(0);
			advance(0.8);
			
			assertEqual(started, ['test']);
		});
		
		test('single overlap regardless of number of ticks', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one'],
				loop: true,
				overlap: 0.2
			}]);
			advance(0);
			advance(0.81);
			advance(0.01);
			advance(0.01);
			
			assertEqual(started, ['one', 'one']);
		});
		
		test('track stops even when ticked higher than duration', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one'],
				loop: false
			}]);
			advance(0);
			advance(1.1);
			
			assertEqual(stopped, ['one']);
		});
		
		test('overlapping track starts tracking time immediately', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one', 'two', 'three'],
				loop: false,
				overlap: 0.2
			}]);
			advance(0);
			advance(0.8); // Track two should start here, as the secondary track.
			advance(0.2); // Track two should now be the primary track, with 0.2 elapsed.
			advance(0.6); // Track three should start here.
			
			assertEqual(started, ['one', 'two', 'three']);
		});
		
		test('overlapping track starts tracking time immediately, accounting for offset', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one', 'two', 'three'],
				loop: false,
				overlap: 0.2
			}]);
			advance(0);
			advance(0.8); // Track two should start here, as the secondary track.
			advance(0.3); // Track two should now be the primary track, with 0.3 elapsed.
			advance(0.5); // Track three should start here.
			
			assertEqual(started, ['one', 'two', 'three']);
		});
		
		test('single track, no loop, shuffle', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['test'],
				loop: false,
				shuffle: true
			}]);
			advance(0);
			advance(1);
			
			assertEqual(started, ['test']);
		});
		
		test('single track, loop, shuffle', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['test'],
				loop: true,
				shuffle: true
			}]);
			advance(0);
			advance(1);
			
			assertEqual(started, ['test', 'test']);
		});
		
		test('two tracks, no loop, shuffle', function() {
			var callbacks = extend(
				defaultCallbacks,
				'shuffle',
				constant(['two', 'one'])
			);
			var start = statefulStage(callbacks);
			start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: false,
				shuffle: true
			}]);
			advance(0);
			advance(1);
			
			assertEqual(started, ['two', 'one']);
		});
		
		test('two tracks, loop, shuffle', function() {
			var callbacks = extend(
				defaultCallbacks,
				'shuffle',
				constant(['two', 'one'])
			);
			var start = statefulStage(callbacks);
			start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: true,
				shuffle: true
			}]);
			advance(0);
			advance(1);
			
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
			var start = statefulStage(callbacks);
			
			start([{
				type: 'sound',
				tracks: ['one', 'two'],
				loop: true,
				shuffle: true
			}]);
			advance(0);
			advance(1);
			advance(1);
			advance(1);
			
			assertEqual(started, ['two', 'one', 'one', 'two']);
		});
		
		test('multiple tracklists, different overlap', function() {
			var start = defaultStage();
			start([
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
			advance(0);
			advance(0.5);
			advance(0.3);
			
			assertEqual(started, ['one', 'two', 'two', 'one']);
		});
		
		test('track plays during overlap', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one', 'two'],
				overlap: 0.2
			}])
			advance(0);
			advance(0.8);
			advance(0.1);
			
			assertEqual(started, ['one', 'two']);
			assertEqual(stopped, []);
		});
		
		test('track stops after overlap', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one', 'two'],
				overlap: 0.2
			}])
			advance(0);
			advance(0.8);
			advance(0.2);
			
			assertEqual(started, ['one', 'two']);
			assertEqual(stopped, ['one']);
		});
		
		test('last track stops', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one']
			}])
			advance(0);
			advance(1);
			
			assertEqual(stopped, ['one']);
		});
		
		test('last track stops, loop', function() {
			var start = defaultStage();
			start([{
				type: 'sound',
				tracks: ['one'],
				loop: true
			}])
			advance(0);
			advance(1);
			
			assertEqual(stopped, ['one']);
		});
		
		function constant(value) {
			return function() {
				return value;
			};
		}
	});
});
