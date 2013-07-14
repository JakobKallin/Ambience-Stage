describe('Ambience audio', function() {
	var stage;
	var stageNode;
	
	beforeEach(function() {
		stageNode = document.createElement('div');
		document.body.appendChild(stageNode);
		stage = new AmbienceStage.Stage(stageNode);
	});
	
	afterEach(function() {
		document.body.removeChild(stageNode);
	});
	
	it('fades audio volume', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.fadeDuration = 1000;
			scene.sound = ['test-audio.ogg'];
			stage.play(scene);
		});
		
		waits(500);
		
		runs(function() {
			// If CSS transitions are used, this has to be changed to getComputedStyle.
			// We're using a fairly generous range for the opacity.
			expect(stage.soundNode.volume).toBeGreaterThan(0.25);
			expect(stage.soundNode.volume).toBeLessThan(0.75);
		});
		
		waits(1000);
		
		runs(function() {
			expect(stage.soundNode.volume).toBe(1);
		});
	});
	
	it('stops non-looping audio-only scenes when audio ends', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.sound = ['test-audio-2s.ogg'];
			scene.loops = false;
			
			stage.play(scene);
		});
		
		waits(500);
		
		runs(function() {
			expect(stage.sceneIsPlaying).toBe(true);
		});
		
		waits(3000);
		
		runs(function() {
			expect(stage.sceneIsPlaying).toBe(false);
		});
	});
	
	it('removes audio element when audio ends', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.image = 'test-image.jpg';
			scene.sound = ['test-audio-2s.ogg'];
			scene.loops = false;
			
			stage.play(scene);
		});
		
		waits(3000);
		
		runs(function() {
			expect(stage.soundCount).toBe(0);
		});
	});
	
	it('crosses over', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.crossoverDuration = 2;
			scene.sound = ['test-audio-5s.ogg', 'test-audio-5s.ogg'];
			scene.loops = false;
			stage.play(scene);
		});
		
		waits(4000);
		
		runs(function() {
			expect(stage.soundCount).toBe(2);
		});
		
		waits(2000);
		
		runs(function() {
			expect(stage.soundCount).toBe(1);
		});
	});
	
	// The test below requires some work to implement. It prevents too long crossover durations from endlessly creating new audio as soon as a track starts.
	/*
	       7.5  10   12.5
	_ _ _ _ _ _ _
	        _ _ _ _ _ _
	              _ _ _ _ _ _ _
	*/
	/*
	it('crosses over at most half of audio length', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.crossoverDuration = 6;
			scene.sound = ['test-audio-10s.ogg', 'test-audio-5s.ogg', 'test-audio-10s.ogg'];
			stage.play(scene);
		});
		
		waits(8500); // 8.5
		
		runs(function() {
			expect(stage.soundCount).toBe(2);
		});
		
		waits(2500); // 11.0
		
		runs(function() {
			expect(stage.soundCount).toBe(2);
		});
		
		waits(2500); // 13.5
		
		runs(function() {
			expect(stage.soundCount).toBe(1);
		});
	});
	*/
	
	it('respects fade level when a new track is started during fade', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.sound = ['test-audio-5s.ogg', 'test-audio-5s.ogg'];
			scene.fadeDuration = 10000;
			scene.fadesIn = false;
			stage.play(scene);
			stage.fadeOut();
		});
		
		waits(6000);
		
		runs(function() {
			expect(stage.soundNode.volume).toBeLessThan(0.5);
		});
	});
});