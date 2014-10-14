/*
* adapt-youtube
* Version - 0.0.0
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/
define(function(require) {

	var ComponentView = require('coreViews/componentView');
	var Adapt = require('coreJS/adapt');

    var youtube = ComponentView.extend({
        
        preRender: function() {

        },

        postRender: function() {

        }
        
    });
    
    Adapt.register("youtube", youtube );
    
});