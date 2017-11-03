/*
* adapt-youtube
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>, Matt Leathes <matt.leathes@kineo.com>
*/
define([
    'core/js/adapt',
    'core/js/views/componentView'
],function(Adapt, ComponentView) {

    var youtube = ComponentView.extend({
        defaults:function() {
            return {
                player: null
            };
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onPlayerStateChange', 'onPlayerReady', 'onInview');

            if (window.onYouTubeIframeAPIReady === undefined) {
                window.onYouTubeIframeAPIReady = function() {
                    console.info('YouTube iframe API loaded');
                    Adapt.youTubeIframeAPIReady = true;
                    Adapt.trigger('youTubeIframeAPIReady');
                };
                $.getScript('//www.youtube.com/iframe_api');
            }
        },

        preRender: function() {
            this.listenTo(Adapt, {
                'device:resize': this.setIFrameSize,
                'device:changed': this.setIFrameSize,
                'media:stop': this.onMediaStop
            });
        },

        setIFrameSize: function () {
            var $iframe = this.$('iframe');
            var widgetWidth = this.$('.component-widget').width();

            $iframe.width(widgetWidth);
            
            var aspectRatio = (this.model.get("_media")._aspectRatio ? parseFloat(this.model.get("_media")._aspectRatio) : 1.778);//default to 16:9 if not specified
            if (!isNaN(aspectRatio)) {
                $iframe.height(widgetWidth / aspectRatio);
            }
        },

        postRender: function() {
            //FOR HTML/HBS Paramenters: https://developers.google.com/youtube/player_parameters
            if (Adapt.youTubeIframeAPIReady === true) {
                this.onYouTubeIframeAPIReady();
            } else {
                Adapt.once('youTubeIframeAPIReady', this.onYouTubeIframeAPIReady, this);
            }
        },

        remove: function() {
            if(this.player !== null) {
                this.player.destroy();
            }

            ComponentView.prototype.remove.call(this);
        },
    
        setupEventListeners: function() {
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');
            if (this.completionEvent === "inview") {
                this.$('.component-widget').on('inview', this.onInview);
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
            //console.info('onYouTubeIframeAPIReady');
	        this.player = new YT.Player(this.$('iframe').get(0), {
                events: {
                    'onStateChange': this.onPlayerStateChange,
                    'onReady': this.onPlayerReady
                }
            });

            this.isPlaying = false;
            
            this.setReadyStatus();
            
            this.setupEventListeners();
            
            this.setIFrameSize();
        },

        onMediaStop: function(view) {
            // if it was this view that triggered the media:stop event, ignore it
            if (view && view.cid === this.cid) return;

            if(this.isPlaying) {
                this.player.pauseVideo();
            }
        },

        onPlayerReady: function() {
            if (this.model.get("_media")._playbackQuality) {
                this.player.setPlaybackQuality(this.model.get("_media")._playbackQuality);
            }
        },

        /**
        * this seems to have issues in Chrome if the user is logged into YouTube (possibly any Google account) - the API just doesn't broadcast the events
        * but instead throws the error:
        * Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://www.youtube.com') does not match the recipient window's origin ('http://www.youtube.com').
        * This is documented here:
        *   https://code.google.com/p/gdata-issues/issues/detail?id=5788
        * but I haven't managed to get any of the workarounds to work... :-(
        */
        onPlayerStateChange: function(event) {
            switch(event.data) {
                case YT.PlayerState.PLAYING:
                    Adapt.trigger("media:stop", this);
                    
                    this.isPlaying = true;

                    if(this.model.get('_setCompletionOn') && this.model.get('_setCompletionOn') === "play") {
                        this.setCompletionStatus();
                    }
                break;
                case YT.PlayerState.PAUSED:
                    this.isPlaying = false;
                break;
                case YT.PlayerState.ENDED:
                    if(this.model.get('_setCompletionOn') && this.model.get('_setCompletionOn') === "ended") {
                        this.setCompletionStatus();
                    }
                break;
            }
            //console.log("this.onPlayerStateChange: " + this.isPlaying);
        }
    },
    {
        template: 'youtube'
    });
    
    Adapt.register("youtube", youtube);

    return youtube;
});
