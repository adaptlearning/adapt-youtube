define([
  'core/js/adapt',
  'core/js/views/componentView',
  'core/js/models/componentModel'
], function(Adapt, ComponentView, ComponentModel) {

  var YouTubeView = ComponentView.extend({
    player: null,

    events: {
      'click .js-youtube-inline-transcript-toggle': 'onToggleInlineTranscript',
      'click .js-youtube-external-transcript-click': 'onExternalTranscriptClicked',
      'click .js-skip-to-transcript': 'onSkipToTranscript'
    },

    initialize: function() {
      ComponentView.prototype.initialize.apply(this);

      this.debouncedTriggerGlobalEvent = _.debounce(this.triggerGlobalEvent.bind(this), 1000);

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
      var widgetWidth = this.$('.component__widget').width();

      $iframe.width(widgetWidth);

      var aspectRatio = (this.model.get('_media')._aspectRatio ? parseFloat(this.model.get('_media')._aspectRatio) : 1.778);// default to 16:9 if not specified
      if (isNaN(aspectRatio)) return;

      $iframe.height(widgetWidth / aspectRatio);
    },

    postRender: function() {
      if (Adapt.youTubeIframeAPIReady === true) {
        this.onYouTubeIframeAPIReady();
        return;
      }
      Adapt.once('youTubeIframeAPIReady', this.onYouTubeIframeAPIReady, this);
    },

    remove: function() {
      if (this.player !== null) {
        this.player.destroy();
      }

      ComponentView.prototype.remove.call(this);
    },

    setupEventListeners: function() {
      this.completionEvent = (this.model.get('_setCompletionOn') || 'play');

      if (this.completionEvent === 'inview') {
        this.setupInviewCompletion('.component__widget');
      }
    },

    onYouTubeIframeAPIReady: function() {
      this.player = new window.YT.Player(this.$('iframe').get(0), {
        events: {
          'onStateChange': this.onPlayerStateChange.bind(this),
          'onReady': this.onPlayerReady.bind(this)
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
      if (!this.model.get('_media')._playbackQuality) return;

      this.player.setPlaybackQuality(this.model.get('_media')._playbackQuality);
    },

    /**
    * this seems to have issues in Chrome if the user is logged into YouTube (possibly any Google account) - the API just doesn't broadcast the events
    * but instead throws the error:
    * Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://www.youtube.com') does not match the recipient window's origin ('http://www.youtube.com').
    * This is documented here:
    *   https://code.google.com/p/gdata-issues/issues/detail?id=5788
    * but I haven't managed to get any of the workarounds to work... :-(
    */
    onPlayerStateChange: function(e) {
      switch (e.data) {
        case window.YT.PlayerState.PLAYING:
          Adapt.trigger('media:stop', this);

          this.debouncedTriggerGlobalEvent('play');// use debounced version because seeking whilst playing will trigger two 'play' events
          this.isPlaying = true;

          if (this.model.get('_setCompletionOn') && this.model.get('_setCompletionOn') === 'play') {
            this.setCompletionStatus();
          }
          break;
        case window.YT.PlayerState.PAUSED:
          this.isPlaying = false;
          this.triggerGlobalEvent('pause');
          break;
        case window.YT.PlayerState.ENDED:
          this.triggerGlobalEvent('ended');

          if (this.model.get('_setCompletionOn') && this.model.get('_setCompletionOn') === 'ended') {
            this.setCompletionStatus();
          }
          break;
      }
    },

    onSkipToTranscript: function() {
      // need slight delay before focussing button to make it work when JAWS is running
      // see https://github.com/adaptlearning/adapt_framework/issues/2427
      _.delay(function() {
        Adapt.a11y.focusFirst(this.$('.youtube__transcript-btn'));
      }.bind(this), 250);
    },

    onToggleInlineTranscript: function(e) {
      if (e && e.preventDefault) e.preventDefault();

      var $transcriptBodyContainer = this.$('.youtube__transcript-body-inline');
      var $button = this.$('.youtube__transcript-btn-inline');
      var $buttonText = $button.find('.youtube__transcript-btn-text');

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
