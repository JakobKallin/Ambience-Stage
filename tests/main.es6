import main from 'ambience.spec';
import dom from 'ambience.dom.spec';

main();
dom();

mocha.checkLeaks();
mocha.run();
