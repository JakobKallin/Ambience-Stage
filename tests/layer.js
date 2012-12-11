describe('Ambience stage', function() {
	var stage;
	var stageNode;
	
	beforeEach(function() {
		stageNode = document.createElement('div');
		document.body.appendChild(stageNode);
		stage = new Ambience.Stage(stageNode);
	});
	
	afterEach(function() {
		document.body.removeChild(stageNode);
	});
	
	it('stops any old scene when playing a new scene', function() {
		var scene = new Ambience.Scene();
		scene.image = 'test-image.jpg';
		stage.play(scene);
		
		var newScene = new Ambience.Scene();
		scene.image = 'test-image.jpg';
		stage.play(scene);
		
		expect(stage.imageCount).toBe(1);
	});
	
	it("fades an entire stage's opacity", function() {
		runs(function() {
			var scene = new Ambience.Scene();
			scene.fadeDuration = 1000;
			stage.play(scene);
		});
		
		waits(500);
		
		runs(function() {
			// If CSS transitions are used, this has to be changed to getComputedStyle.
			// We're using a fairly generous interval for the opacity.
			expect(stage.opacity).toBeGreaterThan(0.25);
			expect(stage.opacity).toBeLessThan(0.75);
		});
		
		waits(1000);
		
		runs(function() {
			expect(stage.opacity).toBeGreaterThan(0.9);
		});
	});
	
	it('stops all layers after fading out', function() {
		runs(function() {
			var scene = new Ambience.Scene();
			scene.fadeDuration = 1000;
			scene.background = 'red';
			scene.image = 'test-image.jpg';
			scene.sounds = ['test-audio.ogg'];
			scene.text = 'Test';
			
			stage.play(scene);
			
			expect(stage.background).toBe('red');
			expect(stage.imageCount).toBe(1);
			expect(stage.soundCount).toBe(1);
			expect(stage.textCount).toBe(1);
		});
		
		waits(1500);
		
		runs(function() {
			stage.fadeOut();
		});
		
		waits(1500);
		
		runs(function() {
			expect(stage.background).toBe(Ambience.Scene.base.background);
			expect(stage.imageCount).toBe(0);
			expect(stage.soundCount).toBe(0);
			expect(stage.textCount).toBe(0);
		});
	});
});