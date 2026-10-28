import React from 'react';
import { classes, compile, templates } from 'core/js/reactHelpers';

// Player parameters: https://developers.google.com/youtube/player_parameters
function getSourceUrl(_media) {
  return [
    `${_media._source}?`,
    `&autoplay=${_media._autoplay ? 1 : 0}`,
    `&rel=${_media._showRelated ? 1 : 0}`,
    `&modestbranding=${_media._modestBranding ? 1 : 0}`,
    `&color=${_media._progressColor || ''}`,
    `&controls=${_media._controls ? 1 : 0}`,
    `&playsinline=${_media._playsinline ? 1 : 0}`,
    '&enablejsapi=1',
    `&iv_load_policy=${_media._showAnnotations ? 1 : 3}`
  ].join('');
}

function YouTubePlayer(props) {
  const {
    _id,
    _media,
    displayTitle,
    title
  } = props;

  return (
    <div className='component__widget youtube__widget'>
      {_media?._source
        ? <iframe
          width='640px'
          height='360px'
          style={{ width: '100%' }}
          referrerPolicy='strict-origin-when-cross-origin'
          src={getSourceUrl(_media)}
          aria-labelledby={displayTitle ? `${_id}-heading` : undefined}
          aria-label={(!displayTitle && title) ? title : undefined}
          allowFullScreen={_media._allowFullscreen || undefined}
          allow='clipboard-write; autoplay; encrypted-media;'
          frameBorder='0'
        />
        : 'ERROR: No media source set!'
      }
    </div>
  );
}

// Never re-render: the YouTube iframe API owns the iframe once it loads
const MemoYouTubePlayer = React.memo(YouTubePlayer, () => true);

export default function YouTube(props) {
  const {
    _id,
    _media,
    _transcript,
    _isInlineTranscriptOpen,
    displayTitle,
    title,
    onToggleInlineTranscript,
    onExternalTranscriptClicked,
    onSkipToTranscript
  } = props;
  const hasTranscript = _transcript?._externalTranscript || _transcript?._inlineTranscript;
  const inlineOpenLabel = _transcript?.inlineTranscriptButton || _transcript?.transcriptLink;
  const inlineButtonText = _isInlineTranscriptOpen
    ? (_transcript?.inlineTranscriptCloseButton || inlineOpenLabel)
    : inlineOpenLabel;
  const externalButtonText = _transcript?.transcriptLinkButton || _transcript?.transcriptLink;

  return (
    <div className='component__inner youtube__inner'>

      <templates.header {...props} />

      {hasTranscript &&
        <button
          className='btn-text youtube__skip-to-transcript js-skip-to-transcript'
          onClick={onSkipToTranscript}
        >
          {props._globals?._components?._youtube?.skipToTranscript}
        </button>
      }

      <MemoYouTubePlayer
        _id={_id}
        _media={_media}
        displayTitle={displayTitle}
        title={title}
      />

      {_transcript &&
        <div className='youtube__transcript-container'>

          {_transcript._inlineTranscript &&
            <button
              className='youtube__transcript-btn youtube__transcript-btn-inline js-youtube-inline-transcript-toggle'
              onClick={onToggleInlineTranscript}
              aria-expanded={!!_isInlineTranscriptOpen}
            >
              <span
                className='youtube__transcript-btn-text'
                dangerouslySetInnerHTML={{ __html: compile(inlineButtonText || '') }}
              />
              <span className='youtube__transcript-btn-icon'>
                <span className='icon' aria-hidden='true' />
              </span>
            </button>
          }

          {_transcript._externalTranscript &&
            <button
              className='youtube__transcript-btn youtube__transcript-btn-external js-youtube-external-transcript-click'
              onClick={onExternalTranscriptClicked}
            >
              <span
                className='youtube__transcript-btn-text'
                dangerouslySetInnerHTML={{ __html: compile(externalButtonText || '') }}
              />
              <span className='youtube__transcript-btn-icon'>
                <span className='icon' aria-hidden='true' />
              </span>
            </button>
          }

          {_transcript._inlineTranscript &&
            <div
              className={classes([
                'youtube__transcript-body-inline',
                _isInlineTranscriptOpen && 'inline-transcript-open'
              ])}
              role='region'
              aria-label={inlineOpenLabel}
            >
              <div
                className='youtube__transcript-body-inline-inner'
                dangerouslySetInnerHTML={{ __html: compile(_transcript.inlineTranscriptBody || '', props) }}
              />
            </div>
          }

        </div>
      }

    </div>
  );
}
