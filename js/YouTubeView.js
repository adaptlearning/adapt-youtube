import a11y from 'core/js/a11y';
import Adapt from 'core/js/adapt';
import logging from 'core/js/logging';
import ComponentView from 'core/js/views/componentView';

export default class YouTubeView extends ComponentView {

  get template() {
    return 'youtube';
  }

  events() {
    return {
      'click .js-youtube-inline-transcript-toggle': 'onToggleInlineTranscript',
      'click .js-youtube-external-transcript-click': 'onExternalTranscriptClicked',
      'click .js-skip-to-transcript': 'onSkipToTranscript'
    };
  }

  initialize() {
    super.initialize();
    _.bindAll(this, 'onPlayerStateChange', 'onPlayerReady', 'onInview');
    this.player = null;
    this.debouncedTriggerGlobalEvent = _.debounce(this.triggerGlobalEvent.bind(this), 1000);
    if (window.onYouTubeIframeAPIReady !== undefined) return;
    window.onYouTubeIframeAPIReady = () => {
      logging.info('YouTube iframe API loaded');
      Adapt.youTubeIframeAPIReady = true;
      Adapt.trigger('youTubeIframeAPIReady');
    };
    $.getScript('//www.youtube.com/iframe_api');
  }

  preRender() {
    this.listenTo(Adapt, {
      'device:resize device:changed': this.setIFrameSize,
      'media:stop': this.onMediaStop
    });
  }

  setIFrameSize() {
    const $iframe = this.$('iframe');
    const widgetWidth = this.$('.component__widget').width();
    $iframe.width(widgetWidth);
    // default aspect ratio to 16:9 if not specified
    const aspectRatio = (parseFloat(this.model.get('_media')._aspectRatio) || 1.778);
    if (isNaN(aspectRatio)) return;
    $iframe.height(widgetWidth / aspectRatio);
  }

  postRender() {
    // for HTML/HBS parameters: https://developers.google.com/youtube/player_parameters
    if (!this.model.get('_media')?._source) {
      this.setReadyStatus();
      this.model.setCompletionStatus();
      return;
    }
    if (Adapt.youTubeIframeAPIReady === true) {
      this.onYouTubeIframeAPIReady();
      return;
    }
    this.listenToOnce(Adapt, 'youTubeIframeAPIReady', this.onYouTubeIframeAPIReady);
  }

  remove() {
    if (this.player !== null) {
      this.player.destroy();
    }
    super.remove();
  }

  setupEventListeners() {
    this.completionEvent = (this.model.get('_setCompletionOn') || 'play');
    if (this.completionEvent !== 'inview') return;
    this.setupInviewCompletion('.component__widget');
  }

  onYouTubeIframeAPIReady() {
    this.player = new window.YT.Player(this.$('iframe').get(0), {
      events: {
        onStateChange: this.onPlayerStateChange,
        onReady: this.onPlayerReady
      }
    });
    this.isPlaying = false;
    this.setReadyStatus();
    this.setupEventListeners();
    this.setIFrameSize();
  }

  onMediaStop(view) {
    // if it was this view that triggered the media:stop event, ignore it
    if (view && view.cid === this.cid) return;
    if (!this.isPlaying) return;
    this.player.pauseVideo();
  }

  onPlayerReady() {
    if (!this.model.get('_media')._playbackQuality) return;
    this.player.setPlaybackQuality(this.model.get('_media')._playbackQuality);
  }

  /**
  * this seems to have issues in Chrome if the user is logged into YouTube (possibly any Google account) - the API just doesn't broadcast the events
  * but instead throws the error:
  * Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://www.youtube.com') does not match the recipient window's origin ('http://www.youtube.com').
  * This is documented here:
  *   https://code.google.com/p/gdata-issues/issues/detail?id=5788
  * but I haven't managed to get any of the workarounds to work... :-(
  */
  onPlayerStateChange(e) {
    switch (e.data) {
      case window.YT.PlayerState.PLAYING:
        Adapt.trigger('media:stop', this);
        this.debouncedTriggerGlobalEvent('play');// use debounced version because seeking whilst playing will trigger two 'play' events
        this.isPlaying = true;
        if (this.model.get('_setCompletionOn') === 'play') {
          this.setCompletionStatus();
        }
        break;
      case window.YT.PlayerState.PAUSED:
        this.isPlaying = false;
        this.triggerGlobalEvent('pause');
        break;
      case window.YT.PlayerState.ENDED:
        this.triggerGlobalEvent('ended');
        if (this.model.get('_setCompletionOn') === 'ended') {
          this.setCompletionStatus();
        }
        break;
    }
  }

  onSkipToTranscript() {
    // need slight delay before focussing button to make it work when JAWS is running
    // see https://github.com/adaptlearning/adapt_framework/issues/2427
    _.delay(() => {
      a11y.focusFirst(this.$('.youtube__transcript-btn'), { defer: true });
    }, 250);
  }

  /**
   * Handles toggling the inline transcript open/closed
   * and updating the label on the inline transcript button
   */
  onToggleInlineTranscript(event) {
    if (event) event.preventDefault();
    const $transcriptBodyContainer = this.$('.youtube__transcript-body-inline');
    const $button = this.$('.youtube__transcript-btn-inline');
    const $buttonText = $button.find('.youtube__transcript-btn-text');

    if ($transcriptBodyContainer.hasClass('inline-transcript-open')) {
      $transcriptBodyContainer.stop(true, true).slideUp(() => {
        $(window).resize();
      }).removeClass('inline-transcript-open');
      $button.attr('aria-expanded', false);
      $buttonText.html(this.model.get('_transcript').inlineTranscriptButton);
      this.transcriptTriggers('closed');

      return;
    }

    $transcriptBodyContainer.stop(true, true).slideDown(() => {
      $(window).resize();
    }).addClass('inline-transcript-open');

    $button.attr('aria-expanded', true);
    $buttonText.html(this.model.get('_transcript').inlineTranscriptCloseButton);
    this.transcriptTriggers('opened');
  }
  
  onExternalTranscriptClicked(event) {
    this.transcriptTriggers('external');
  }

  transcriptTriggers(state) {
    const setCompletionOnView = this.model.get('_transcript')._setCompletionOnView;
    const isComplete = this.model.get('_isComplete');
    const shouldComplete = (setCompletionOnView && !isComplete);

    if (!shouldComplete) {
      return Adapt.trigger('youtube:transcript', state, this);
    }
    this.setCompletionStatus();
    Adapt.trigger('youtube:transcript', 'complete', this);
  }

  triggerGlobalEvent(eventType) {
    Adapt.trigger('media', {
      isVideo: true,
      type: eventType,
      src: this.model.get('_media')._source,
      platform: 'YouTube'
    });
  }

}
