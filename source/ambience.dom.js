'use strict';

ambience.dom = function(container) {
    return {
        scene: function() {
            return {
                fade: function(opacity) {
                    container.style.opacity = Math.min(opacity, 0.999);
                }
            };
        },
        image: function(image) {
            var element = document.createElement('div');
            element.style.backgroundImage = 'url(' + image.url + ')';
            container.appendChild(element);
            
            if ( image.style ) {
                Object.keys(image.style).forEach(function(cssKey) {
                    var cssValue = image.style[cssKey];
                    element.style[cssKey] = cssValue;
                });
            }
            
            return {
                stop: function() {
                    container.removeChild(element);
                }
            };
        }
    };
};
