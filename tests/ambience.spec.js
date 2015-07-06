'use strict';

suite('ambience', function() {
	var assert = chai.assert;
	var assertEqual = chai.assert.deepEqual;
	var assertError = chai.assert.throws;
	chai.config.truncateThreshold = 0;
	
	var ambience = window.ambience;
	
	function nothing() {}
	
	var time;
	var updates;
	var advance;
	setup(function() {
		time = 0;
		updates = [];
		advance = function(amount) {
			time += amount;
			updates.forEach(function(update) {
			    update();
			});
		}
	});
	
	suite('scene', function() {
		var events;
		var start;
		var stop;
		
		setup(function() {
			events = [];
			
			var callbacks = {
				start: {
					scene: function(update) {
						updates.push(update);
						events.push('start');
						return function stop() {
							events.push('stop');
						};
					}
				},
				fade: {
					scene: {
						in: function(progress) {
							events.push('fade in ' + (progress * 100) + '%');
						},
						out: function(progress) {
							events.push('fade out ' + (progress * 100) + '%');
						}
					}
				},
				time: function() {
					return time;
				}
			};
			
			start = function(items, fade) {
				fade = fade || 0;
		    	return ambience.start.scene(items, fade, callbacks);
			};
		});
		
		test('start scene', function() {
			start([]);
			
			assertEqual(events, ['start']);
		});
		
		test('stop scene', function() {
			var stop = start([]);
			stop(0);
			
			assertEqual(events, ['start', 'stop']);
		});
		
		test('stop scene twice', function() {
			var stop = start([]);
			stop(0);
			stop(0);
			
			assertEqual(events, ['start', 'stop']);
		});
		
		test('abort scene without fading', function() {
		    var stop = start([]);
			var abort = stop(0);
			abort();
			
			assertEqual(events, ['start', 'stop']);
		});
		
		test('abort scene without fading twice', function() {
		    var stop = start([]);
			var abort = stop(0);
			abort();
			abort();
			
			assertEqual(events, ['start', 'stop']);
		});
		
		test('abort scene with fading, before', function() {
		    var stop = start([]);
			var abort = stop(1000);
			abort();
			
			assertEqual(events, ['start', 'stop']);
		});
		
		test('abort scene with fading, beginning', function() {
		    var stop = start([]);
			var abort = stop(1000);
			advance(0);
			abort();
			
			assertEqual(events, ['start', 'fade out 0%', 'stop']);
		});
		
		test('abort scene with fading, middle', function() {
		    var stop = start([]);
			var abort = stop(1000);
			advance(500);
			abort();
			
			assertEqual(events, ['start', 'fade out 50%', 'stop']);
		});
		
		test('abort scene with fading, end', function() {
		    var stop = start([]);
			var abort = stop(1000);
			advance(1000);
			abort();
			
			assertEqual(events, ['start', 'fade out 100%', 'stop']);
		});
		
		test('abort scene with fading, after', function() {
		    var stop = start([]);
			var abort = stop(1000);
			advance(1500);
			abort();
			
			assertEqual(events, ['start', 'fade out 100%', 'stop']);
		});
		
		test('fade in, before', function() {
			start([], 1000);
			
			assertEqual(events, ['start']);
		});
		
		test('fade in, beginning', function() {
			start([], 1000);
			advance(0);
			
			assertEqual(events, ['start', 'fade in 0%']);
		});
		
		test('fade in, middle', function() {
			start([], 1000);
			advance(500);
			
			assertEqual(events, ['start', 'fade in 50%']);
		});
		
		test('fade in, end', function() {
			start([], 1000);
			advance(1000);
			
			assertEqual(events, ['start', 'fade in 100%']);
		});
		
		test('fade in, after', function() {
			start([], 1000);
			advance(1500);
			
			assertEqual(events, ['start', 'fade in 100%']);
		});
		
		test('fade out, before', function() {
			var stop = start([]);
			stop(1000);
			
			assertEqual(events, ['start']);
		});
		
		test('fade out, beginning', function() {
			var stop = start([]);
			stop(1000);
			advance(0);
			
			assertEqual(events, ['start', 'fade out 0%']);
		});
		
		test('fade out, middle', function() {
			var stop = start([]);
			stop(1000);
			advance(500);
			
			assertEqual(events, ['start', 'fade out 50%']);
		});
		
		test('fade out, end', function() {
			var stop = start([]);
			stop(1000);
			advance(1000);
			
			assertEqual(events, ['start', 'fade out 100%', 'stop']);
		});
		
		test('fade out, after', function() {
			var stop = start([]);
			stop(1000);
			advance(1500);
			
			assertEqual(events, ['start', 'fade out 100%', 'stop']);
		});
		
		test('stop scene during fade-in', function() {
		    var stop = start([], 1000);
			advance(500);
			stop(0);
			advance(100);
			
			assertEqual(events, ['start', 'fade in 50%', 'stop']);
		});
		
		test('fade out scene during fade-in', function() {
		    var stop = start([], 1000);
			advance(500);
			stop(1000);
			advance(500);
			
			assertEqual(events, ['start', 'fade in 50%', 'fade out 50%']);
		});
		
		test('abort scene during fade-out', function() {
		    var stop = start([]);
			var abort = stop(1000);
			advance(500);
			abort(0);
			advance(100);
			
			assertEqual(events, ['start', 'fade out 50%', 'stop']);
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
		
		function extend(object, newProperty, value) {
			var newObject = {};
			for ( var property in object ) {
				newObject[property] = object[property];
			}
			newObject[newProperty] = value;
			return newObject;
		}
		
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
