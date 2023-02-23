# adapt-youtube

**Adapt YouTube** is a *presentation component* that allows the [YouTube IFrame Player](https://developers.google.com/youtube/iframe_api_reference) to be used within Adapt. For a fuller description of the various settings in example.json, see the [YouTube IFrame Player API](https://developers.google.com/youtube/player_parameters).

## Installation

TBC

## Settings Overview

The attributes listed below are used in *components.json* to configure **Adapt YouTube Player**, and are properly formatted as JSON in [*example.json*](https://github.com/adaptlearning/adapt-youtube/example.json).

### Attributes

[**core model attributes**](https://github.com/adaptlearning/adapt_framework/wiki/Core-model-attributes): These are inherited by every Adapt component. [Read more](https://github.com/adaptlearning/adapt_framework/wiki/Core-model-attributes).

**_component** (string): This value must be: `youtube`.

**_classes** (string): CSS class name to be applied to **YouTube** containing `div`. The class must be predefined in one of the Less files. Separate multiple classes with a space.

**_layout** (string): This defines the horizontal position of the component in the block. Acceptable values are `full`, `left` or `right`.

**instruction** (string): This optional text appears above the component. It is frequently used to guide the learner’s interaction with the component.

**_setCompletionOn** (string): This determines when Adapt will register this component as having been completed by the user. Acceptable values are `inview` (triggered when the component is fully displayed within the viewport), `play` (triggered when playback is initiated), or `ended` (triggered when the video has reached the end of playback).

**_media** (object): The media configuration, containing values for various YouTube API features

>**_source** (string): The URL of the YouTube video. This can be a direct link or an embed link

>**_controls** (string): Specifies whether or not the player controls are displayed.

>**_allowFullscreen** (string): Setting to give the learners option to play the YouTube video at full screen.

>**_playsinline** (string): If enabled, videos will play 'inline' on iPhones (the same way they do on iPads).

>**_aspectRatio** (string): The aspect ratio of the video as a decimal number. If the aspect ratio is 16:9 then you calculate the decimal version by dividing 16 by 9 i.e. 1.778. 4:3 aspect ratio is 1.33.

>**_autoplay** (boolean): Specifies whether or not the video will automatically start to play when the player loads (not supported on iOS).

>**_showRelated** (boolean): Since Sept 2018 the YouTube player no longer allows you to prevent related videos from being shown - see https://developers.google.com/youtube/player_parameters#rel

>**_loop** (boolean): Whether to play the video on a loop or not.

>**_modestBranding** (boolean): This parameter lets you use a YouTube player that does not show a YouTube logo. Set to true to prevent the YouTube logo from displaying in the control bar. Note that a small YouTube text label will still display in the upper-right corner of a paused video when the user's mouse pointer hovers over the player.

>**_playbackQuality** (boolean): The suggested video quality for the video. You should select a playback quality that corresponds to the size of your video player. For example, if your page displays a 1280px by 720px video player, a hd720 quality video will actually look better than an hd1080 quality video.

>**_showAnnotations** (boolean): Whether video annotations should be shown or not.

>**_progressColor** (boolean): The colour that will be used in the player's video progress bar to highlight the amount of the video that the viewer has already seen. Setting this to 'white' will disable the 'modest branding' option.

**_transcript** (object):  The transcript attributes group contains values for **_inlineTranscript**, **_externalTranscript**, **inlineTranscriptButton**, **inlineTranscriptCloseButton**, **inlineTranscriptBody**, **transcriptLinkButton**, and **transcriptLink**.

>**_setCompletionOnView** (boolean): This determines if Adapt will register this component as having been completed by the user when the inline transcript is opened. This is true by default.

>**_inlineTranscript** (boolean): Determines whether the button that toggles the display of the inline transcript text will be displayed or not.

>**_externalTranscript** (boolean): Determines whether the button that links to the optional external transcript will be displayed or not.

>**inlineTranscriptButton** (string): This text appears on the button that toggles the visibility of the inline transcript text. It is displayed when the inline transcript text is hidden. If no text is provided, the **transcriptLink** will be displayed on the button.

>**inlineTranscriptCloseButton** (string): This text appears on the button that toggles the visibility of the inline transcript. It is displayed when the inline transcript text is visible.

>**inlineTranscriptBody** (string): This optional text appears below the video. If provided, its visibility is toggled by clicking the transcript button. It is hidden by default.

>**transcriptLinkButton** (string): This text appears on the button that links to the optional external transcript. If no text is provided, the **transcriptLink** will be displayed on the button.

>**transcriptLink** (string): File name (including path) of the optional external transcript. Path should be relative to the *src* folder (e.g., *course/en/pdf/video01_transcript.pdf*).

### Accessibility

### Limitations

No known limitations

----------------------------
**Framework versions:** 5.19.1<br>
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/adaptlearning/adapt-youtube/graphs/contributors)