define([
    'core/js/adapt',
    'core/js/views/componentView',
    'core/js/models/componentModel'
], function(Adapt, ComponentView, ComponentModel) {

    var YouTubeView = ComponentView.extend({
        player: null,

        events: {
            'click .youtube-inline-transcript-button': 'onToggleInlineTranscript',
            'click .youtube-external-transcript-button': 'onExternalTranscriptClicked',
            'click .js-skip-to-transcript': 'onSkipToTranscript'
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onPlayerStateChange', 'onPlayerReady', 'onInview');

            if (window.onYouTubeIframeAPIReady === undefined) {
                window.onYouTubeIframeAPIReady = function() {
                    Adapt.log.info('YouTube iframe API loaded');
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

            var aspectRatio = (this.model.get('_media')._aspectRatio ? parseFloat(this.model.get('_media')._aspectRatio) : 1.778);//default to 16:9 if not specified
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
            if (this.completionEvent === 'inview') {
                this.$('.component-widget').on('inview', this.onInview);
            }
        },

        // TODO use the new core inview code instead (this will require FW dependency bump)
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

            if (this.isPlaying) {
                this.player.pauseVideo();
            }
        },

        onPlayerReady: function() {
            if (this.model.get('_media')._playbackQuality) {
                this.player.setPlaybackQuality(this.model.get('_media')._playbackQuality);
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
                    Adapt.trigger('media:stop', this);

                    this.triggerGlobalEvent('play');

                    this.isPlaying = true;

                    if(this.model.get('_setCompletionOn') && this.model.get('_setCompletionOn') === 'play') {
                        this.setCompletionStatus();
                    }
                break;
                case YT.PlayerState.PAUSED:
                    this.isPlaying = false;

                    this.triggerGlobalEvent('pause');
                break;
                case YT.PlayerState.ENDED:
                    this.triggerGlobalEvent('ended');

                    if(this.model.get('_setCompletionOn') && this.model.get('_setCompletionOn') === 'ended') {
                        this.setCompletionStatus();
                    }
                break;
            }
            //console.log('this.onPlayerStateChange: ' + this.isPlaying);
        },

        onSkipToTranscript: function() {
            this.$('.youtube-transcript-container button').a11y_focus();
        },

        onToggleInlineTranscript: function(e) {
            if (e) e.preventDefault();

            var $transcriptBodyContainer = this.$('.youtube-inline-transcript-body-container');
            var $button = this.$('.youtube-inline-transcript-button');
            var $buttonText = this.$('.youtube-inline-transcript-button .transcript-text-container');

            if ($transcriptBodyContainer.hasClass('inline-transcript-open')) {
                $transcriptBodyContainer.stop(true, true).slideUp(function() {
                    $(window).resize();
                }).removeClass('inline-transcript-open');

                $button.attr('aria-expanded', false);
                $buttonText.html(this.model.get('_transcript').inlineTranscriptButton);

                return;
            }

            $transcriptBodyContainer.stop(true, true).slideDown(function() {
                $(window).resize();
            }).addClass('inline-transcript-open');

            $button.attr('aria-expanded', true);
            $buttonText.html(this.model.get('_transcript').inlineTranscriptCloseButton);

            if (this.model.get('_transcript')._setCompletionOnView !== false) {
                this.setCompletionStatus();
            }
        },

        onExternalTranscriptClicked: function() {
            if (this.model.get('_transcript')._setCompletionOnView !== false) {
                this.setCompletionStatus();
            }
        },

        triggerGlobalEvent: function(eventType) {
            Adapt.trigger('media', {
                isVideo: true,
                type: eventType,
                src: this.model.get('_media')._source,
                platform: 'YouTube'
            });
        }
    }, {
        template: 'youtube'
    });

    return Adapt.register('youtube', {
        model: ComponentModel.extend({}),
        view: YouTubeView
    });
});
