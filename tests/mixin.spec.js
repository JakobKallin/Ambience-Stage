// This file is part of Ambience Stage
// Copyright 2012 Jakob Kallin
// License: GNU GPL (http://www.gnu.org/licenses/gpl-3.0.txt)

describe('Ambience mixin', function() {
	var player;
	var playerNode;
	
	beforeEach(function() {
		playerNode = document.createElement('div');
		document.body.appendChild(playerNode);
		player = new AmbienceStage.DebugScenePlayer(playerNode);
	});
	
	beforeEach(function() {
		this.addMatchers({
			toBeBetween: function(first, second) {
				var lowest = Math.min(first, second);
				var highest = Math.max(first, second);
				
				return lowest <= this.actual && this.actual <= highest;
			}
		});
	});
	
	afterEach(function() {
		document.body.removeChild(playerNode);
	});
	
	it('replaces defined properties', function() {
		var scene = new AmbienceStage.Scene(['Text']);
		scene.text.string = 'Test';
		player.play(scene);
		
		var mixin = new AmbienceStage.Scene(['Text']);
		mixin.text.string = 'Mixin';
		player.mixin(mixin);
		
		expect(player.textNode.textContent).toBe('Mixin');
	});
	
	it('retains undefined properties', function() {
		var scene = new AmbienceStage.Scene(['Text']);
		scene.text.string = 'Test';
		player.play(scene);
		
		var mixin = new AmbienceStage.Scene(['Image']);
		mixin.image.url = 'test-image.jpg';
		player.mixin(mixin);
		
		expect(player.textNode.textContent).toBe('Test');
		expect(player.imageNode.style.backgroundImage).toMatch(/test-image/);
	});
	
	it('ignores fading when a scene is already playing', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene(['Text']);
			scene.text.string = 'Test';
			player.play(scene);
			
			var mixin = new AmbienceStage.Scene(['Text']);
			mixin.text.string = 'Mixin';
			mixin.fade.in = 2000;
			player.mixin(mixin);
		});
		
		waits(1000);
		
		runs(function() {
			expect(player.opacity).toBeGreaterThan(0.9);
		});
	});
	
	it('respects fading when a scene is not already playing', function() {
		runs(function() {
			var mixin = new AmbienceStage.Scene(['Text']);
			mixin.text.string = 'Mixin';
			mixin.fade.in = 2000;
			player.mixin(mixin);
		});
		
		waits(1000);
		
		runs(function() {
			expect(player.opacity).toBeBetween(0.25, 0.75);
		});
	});
	
	it('respects opacity when mixed-in during fade', function() {
		runs(function() {
			var base = new AmbienceStage.Scene(['Image']);
			base.image.url = 'test-image.jpg';
			base.fade.in = 2000;
			player.play(base);
		});
		
		waits(500);
		
		runs(function() {
			var mixin = new AmbienceStage.Scene(['Text']);
			mixin.text.string = 'Mixin';
			player.mixin(mixin);
		});
		
		waits(500);
		
		runs(function() {
			expect(player.opacity).toBeBetween(0.25, 0.75);
		});
	});
	
	it('respects volume when mixed-in during fade', function() {
		runs(function() {
			var base = new AmbienceStage.Scene(['Sound']);
			base.sound.tracks = ['test-audio.ogg'];
			base.fade.in = 2000;
			player.play(base);
		});
		
		waits(500);
		
		runs(function() {
			var mixin = new AmbienceStage.Scene(['Sound']);
			mixin.sound.tracks = ['test-audio.ogg'];
			player.mixin(mixin);
		});
		
		waits(500);
		
		runs(function() {
			expect(player.soundNode.volume).toBeBetween(0.25, 0.75);
		});
	});
	
	it('keeps playing visual scene even after audio of mixed-in one-shot audio scene ends', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene(['Image']);
			scene.image.url = 'test-image.jpg';
			player.play(scene);
			
			var mixin = new AmbienceStage.Scene(['Sound']);
			mixin.sound.tracks = ['test-audio-2s.ogg'];
			mixin.sound.loop = false;
			player.mixin(mixin);
		});
		
		waits(500);
		
		runs(function() {
			expect(player.soundCount).toBe(1);
		});
		
		waits(3000);
		
		runs(function() {
			expect(player.sceneIsPlaying).toBe(true);
		});
	});
	
	it('displays visual mixin even when previous scene was not visual', function() {
		var scene = new AmbienceStage.Scene(['Sound']);
		scene.sound.tracks = ['test-audio-2s.ogg'];
		scene.sound.loop = false;
		player.play(scene);
		
		var mixin = new AmbienceStage.Scene(['Image']);
		mixin.image.url = 'test-image.jpg';
		player.mixin(mixin);
		
		expect(playerNode.style.visibility).toBe('visible');
	});
	
	it('respects volume of mixed-in scene', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene(['Sound']);
			scene.sound.tracks = ['test-audio-2s.ogg'];
			scene.sound.loop = false;
			player.play(scene);
			
			var mixin = new AmbienceStage.Scene(['Sound']);
			mixin.sound.tracks = ['test-audio-2s.ogg'];
			mixin.sound.volume = 0.5;
			mixin.sound.loop = false;
			player.mixin(mixin);
		});
		
		waits(500);
		
		runs(function() {
			expect(player.soundNode.volume).toBeBetween(0.45, 0.55);
		});
	});
});