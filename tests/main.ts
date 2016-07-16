import scene from './specs/scene.spec';
import media from './specs/media.spec';
import sound from './specs/sound.spec';
import stage from './specs/stage.spec';
import dom from './specs/dom.spec';

declare var mocha:any;
declare var chai:any;
declare var setup:any;
declare var suite:any;
declare var test:any;

chai.config.truncateThreshold = 0;

suite('Ambience', () => {
    suite('Scene', scene);
    suite('Media', media);
    suite('Sound', sound);
    suite('Stage', stage);
});
suite('Ambience DOM', dom);

mocha.checkLeaks();
mocha.run();
