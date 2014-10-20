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
            this.listenTo(Adapt, 'device:resize', this.onScreenSizeChanged);
            this.listenTo(Adapt, 'device:changed', this.onDeviceChanged);
        },

        onScreenSizeChanged: function() {
            this.$('iframe').width(this.$('.component-widget').width());
        },

        onDeviceChanged: function() {
            this.$('iframe').width(this.$('.component-widget').width());
        },

        postRender: function() {
            //FOR HTML/HBS Paramenters: https://developers.google.com/youtube/player_parameters
        	this.setReadyStatus();
            this.setupEventListeners();
        },

    
        setupEventListeners: function() {
            //Completion events play/inview
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');
            if (this.completionEvent !== "inview") {
                //TODO: youtube on play completion using https://developers.google.com/youtube/iframe_api_reference
                //calback to this.onCompletion

            } else {
                this.$('.component-widget').on('inview', _.bind(this.onInview, this));
            }
        },

        onInview: function(event, visible, visiblePartX, visiblePartY) {
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

        onCompletion: function() {
            this.setCompletionStatus();
        }
        
    });
    
    Adapt.register("youtube", youtube );
    
});