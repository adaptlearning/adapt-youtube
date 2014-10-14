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
        	this.setReadyStatus();
            this.setupEventListeners();
        },

        inview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    this.$('.component-inner').off('inview');
                    this.setCompletionStatus();
                }
                
            }
        },

        setupEventListeners: function() {
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');
            if (this.completionEvent !== "inview") {
                //this.mediaElement.addEventListener(this.completionEvent, _.bind(this.onCompletion, this));
                
            } else {
                this.$('.component-widget').on('inview', _.bind(this.inview, this));
            }
        },

        onCompletion: function() {
            this.setCompletionStatus();
            // removeEventListener needs to pass in the method to remove the event in firefox and IE10
            this.mediaElement.removeEventListener(this.completionEvent, this.onCompletion);
        }
        
    });
    
    Adapt.register("youtube", youtube );
    
});