describe('Ambience mixin', function() {
	var stage;
	var stageNode;
	
	beforeEach(function() {
		stageNode = document.createElement('div');
		document.body.appendChild(stageNode);
		stage = new AmbienceStage.Stage(stageNode);
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
		document.body.removeChild(stageNode);
	});
	
	it('replaces defined properties', function() {
		var scene = new AmbienceStage.Scene();
		scene.text = 'Test';
		stage.play(scene);
		
		var mixin = new AmbienceStage.Scene();
		mixin.isMixin = true;
		mixin.text = 'Mixin';
		stage.play(mixin);
		
		expect(stage.textNode.textContent).toBe('Mixin');
	});
	
	it('retains undefined properties', function() {
		var scene = new AmbienceStage.Scene();
		scene.text = 'Test';
		stage.play(scene);
		
		var mixin = new AmbienceStage.Scene();
		mixin.isMixin = true;
		mixin.image = 'test-image.jpg';
		stage.play(mixin);
		
		expect(stage.textNode.textContent).toBe('Test');
		expect(stage.imageNode.style.backgroundImage).toMatch(/test-image/);
	});
	
	it('ignores fading when another scene is playing', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.text = 'Test';
			stage.play(scene);
			
			var mixin = new AmbienceStage.Scene();
			mixin.isMixin = true;
			mixin.text = 'Mixin';
			mixin.fadeDuration = 2000;
			stage.play(mixin);
		});
		
		waits(1000);
		
		runs(function() {
			expect(stage.opacity).toBeGreaterThan(0.9);
		});
	});
	
	it('respects fading when another scene is not playing', function() {
		runs(function() {
			var mixin = new AmbienceStage.Scene();
			mixin.isMixin = true;
			mixin.text = 'Mixin';
			mixin.fadeDuration = 2000;
			stage.play(mixin);
		});
		
		waits(1000);
		
		runs(function() {
			expect(stage.opacity).toBeBetween(0.25, 0.75);
		});
	});
	
	it('respects current visual fade level when mixed-in during fade', function() {
		runs(function() {
			var base = new AmbienceStage.Scene();
			base.image = 'test-image.jpg';
			base.fadeDuration = 2000;
			stage.play(base);
		});
		
		waits(500);
		
		runs(function() {
			var mixin = new AmbienceStage.Scene();
			mixin.isMixin = true;
			mixin.text = 'Mixin';
			stage.play(mixin);
		});
		
		waits(500);
		
		runs(function() {
			expect(stage.opacity).toBeBetween(0.25, 0.75);
		});
	});
	
	it('respects current audio fade level when mixed-in during fade', function() {
		runs(function() {
			var base = new AmbienceStage.Scene();
			base.sound = ['test-audio.ogg'];
			base.fadeDuration = 2000;
			stage.play(base);
		});
		
		waits(500);
		
		runs(function() {
			var mixin = new AmbienceStage.Scene();
			mixin.isMixin = true;
			mixin.sound = ['test-audio.ogg'];
			stage.play(mixin);
		});
		
		waits(500);
		
		runs(function() {
			expect(stage.soundNode.volume).toBeBetween(0.25, 0.75);
		});
	});
	
	it('only mixes in properties of media when media itself is present', function() {
		var base = new AmbienceStage.Scene();
		base.text = 'Base';
		base.textStyle = { color: 'red' }
		stage.play(base);
		
		var mixin = new AmbienceStage.Scene();
		mixin.isMixin = true;
		mixin.textStyle = { color: 'blue' };
		stage.play(mixin);
		
		expect(stageNode.querySelector('.text.inner').style.color).toBe('red');
	});
	
	it('keeps playing visual scene even after audio of mixed-in audio-only scene ends', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.image = 'test-image.jpg';
			stage.play(scene);
			
			var mixin = new AmbienceStage.Scene();
			mixin.isMixin = true;
			mixin.sound = ['test-audio-2s.ogg'];
			mixin.loops = false;
			stage.play(mixin);
		});
		
		waits(500);
		
		runs(function() {
			expect(stage.soundCount).toBe(1);
		});
		
		waits(3000);
		
		runs(function() {
			expect(stage.sceneIsPlaying).toBe(true);
		});
	});
	
	it('displays visual mixin even when previous scene was not visual', function() {
		var scene = new AmbienceStage.Scene();
		scene.sound = ['test-audio-2s.ogg'];
		scene.loops = false;
		stage.play(scene);
		
		var mixin = new AmbienceStage.Scene();
		mixin.isMixin = true;
		mixin.image = 'test-image.jpg';
		stage.play(mixin);
		
		expect(stageNode.style.visibility).toBe('visible');
	});
	
	it('respects volume of mixed-in scene', function() {
		runs(function() {
			var scene = new AmbienceStage.Scene();
			scene.sound = ['test-audio-2s.ogg'];
			scene.loops = false;
			stage.play(scene);
			
			var mixin = new AmbienceStage.Scene();
			mixin.isMixin = true;
			mixin.sound = ['test-audio-2s.ogg'];
			mixin.volume = 0.5;
			mixin.loops = false;
			stage.play(mixin);
		});
		
		waits(500);
		
		runs(function() {
			expect(stage.soundNode.volume).toBeBetween(0.45, 0.55);
		});
	});
});