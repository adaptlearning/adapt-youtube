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
        defaults:function() {
            return {
                player:null
            }
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            if (window.onYouTubeIframeAPIReady === undefined) {
                window.onYouTubeIframeAPIReady = function() {
                    console.info('YouTube iframe API loaded');
                    Adapt.youTubeIframeAPIReady = true;
                    Adapt.trigger('youTubeIframeAPIReady');
                };
                $.getScript('https://www.youtube.com/iframe_api');
            }
        },

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
            if (Adapt.youTubeIframeAPIReady === true) this.onYouTubeIframeAPIReady();
            else Adapt.once('youTubeIframeAPIReady', this.onYouTubeIframeAPIReady, this)
        },
    
        setupEventListeners: function() {
            //Completion events play/inview
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');
            if (this.completionEvent !== "inview") {
                //https://developers.google.com/youtube/iframe_api_reference
                this.player.addEventListener('onStateChange', _.bind(this.onPlayerStateChange, this));
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

        onYouTubeIframeAPIReady: function() {
            console.info('onYouTubeIframeAPIReady');
            this.player = new YT.Player(this.$('iframe').get(0));
            this.setReadyStatus();
            this.setupEventListeners();
        },

        onPlayerStateChange: function(event) {
            if (event.data == YT.PlayerState.ENDED) this.onCompletion();
        },

        onCompletion: function() {
            this.setCompletionStatus();
        }
        
    });
    
    Adapt.register("youtube", youtube );
    
});
