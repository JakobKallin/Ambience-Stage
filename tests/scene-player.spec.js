// This file is part of Ambience Stage
// Copyright 2012 Jakob Kallin
// License: GNU GPL (http://www.gnu.org/licenses/gpl-3.0.txt)

describe('Ambience scene player', function() {
	var player;
	var playerNode;
	
	beforeEach(function() {
		playerNode = document.createElement('div');
		document.body.appendChild(playerNode);
		player = new AmbienceStage.DebugScenePlayer(playerNode);
	});
	
	afterEach(function() {
		document.body.removeChild(playerNode);
	});
	
	it('stops current scene when starting new scene', function() {
		var scene = new AmbienceStage.Scene(['Image']);
		scene.image.url = 'test-image.jpg';
		player.play(scene);
		
		var newScene = new AmbienceStage.Scene(['Image']);
		scene.image.url = 'test-image.jpg';
		player.play(scene);
		
		expect(player.imageCount).toBe(1);
	});
	
	it("fades the entire player's opacity", function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.fade.in = 1000;
			player.play(scene);
		});
		
		waits(500);
		
		runs(function() {
			// If CSS transitions are used, this has to be changed to getComputedStyle.
			// We're using a fairly generous interval for the opacity.
			expect(player.opacity).toBeGreaterThan(0.25);
			expect(player.opacity).toBeLessThan(0.75);
		});
		
		waits(1000);
		
		runs(function() {
			expect(player.opacity).toBeGreaterThan(0.9);
		});
	});
	
	it('stops all media after fading out', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene(['Background', 'Image', 'Sound', 'Text']);
			scene.fade.in = scene.fade.out = 1000;
			scene.background.color = 'red';
			scene.image.url = 'test-image.jpg';
			scene.sound.tracks = ['test-audio.ogg'];
			scene.text.string = 'Test';
			
			player.play(scene);
			
			expect(player.background).toBe('red');
			expect(player.imageCount).toBe(1);
			expect(player.soundCount).toBe(1);
			expect(player.textCount).toBe(1);
		});
		
		waits(1500);
		
		runs(function() {
			player.fadeOut();
		});
		
		waits(1500);
		
		runs(function() {
			expect(player.background).toBe('black');
			expect(player.imageCount).toBe(0);
			expect(player.soundCount).toBe(0);
			expect(player.textCount).toBe(0);
		});
	});

	it('interrupts scene that is fading out', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene(['Image']);
			scene.image.url = 'test-image.jpg';
			scene.fade.out = 1000;
			player.play(scene);
			player.fadeOut();
		});

		waits(500);

		runs(function() {
			player.stop();
			expect(player.opacity).toBe(0);
			expect(playerNode.style.visibility).toBe('hidden');
			expect(player.sceneIsPlaying).toBe(false);
		});
	});
	
	// This test guards against possible leftover state.
	// In particular, a previous bug made a stopped player appear to be fading out even though it was not.
	it('plays scene again after immediate fade-out', function() {
		var scene = new AmbienceStage.Scene(['Image']);
		scene.image.url = 'test-image.jpg';
		
		player.play(scene);
		player.fadeOut();
		player.play(scene);
		
		expect(player.opacity).toNotBe(0);
		expect(player.sceneIsPlaying).toBe(true);
	});
});