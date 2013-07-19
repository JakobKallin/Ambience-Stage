// This file is part of Ambience Stage
// Copyright 2012-2013 Jakob Kallin
// License: GNU GPL (http://www.gnu.org/licenses/gpl-3.0.txt)

describe('Ambience stage', function() {
	var stage;
	var stageNode;
	
	beforeEach(function() {
		stageNode = document.createElement('div');
		document.body.appendChild(stageNode);
		stage = new AmbienceStage(stageNode);
	});
	
	afterEach(function() {
		document.body.removeChild(stageNode);
	});
	
	it('crossfades two scenes', function() {
		runs(function() {
			stage.play(new ImageScene());
			
			var second = new ImageScene();
			second.fade.in = 500;
			stage.play(second);
		});
		
		waits(250);
		
		runs(function() {
			expect(stageNode.children.length).toBe(2);
		});
	});
	
	it('removes old scene after crossfading', function() {
		runs(function() {
			stage.play(new ImageScene());
			
			var second = new ImageScene();
			second.fade.in = 500;
			stage.play(second);
		});
		
		waits(600);
		
		runs(function() {
			expect(stageNode.children.length).toBe(1);
		});
	});
	
	it('completes crossfade before starting new crossfade', function() {
		runs(function() {
			stage.play(new ImageScene());
			
			var second = new ImageScene();
			second.fade.in = 500;
			stage.play(second);
		});
		
		waits(250);
		
		runs(function() {
			var third = new ImageScene();
			third.fade.in = 500;
			stage.play(third);
			
			expect(stageNode.children.length).toBe(2);
		});
	});
	
	it('crossfades using fade-in duration of new scene', function() {
		runs(function() {
			var first = new ImageScene();
			first.fade.out = 0;
			stage.play(first);
			
			var second = new ImageScene();
			second.fade.in = 500;
			stage.play(second);
		});
		
		waits(250);
		
		// We cannot check number of children here, because the stage does not immediately remove scene players when a scene stops.
		runs(function() {
			expect(Number(stageNode.firstChild.style.opacity)).toBeGreaterThan(0);
		});
	});
	
	function ImageScene() {
		var scene = new AmbienceStage.Scene(['Image']);
		scene.image.url = 'test-image.jpg';
		return scene;
	}
});