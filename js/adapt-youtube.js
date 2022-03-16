import Adapt from 'core/js/adapt';
import ComponentModel from 'core/js/models/componentModel';
import YouTubeView from './YouTubeView';

export default Adapt.register('youtube', {
  model: ComponentModel.extend({}),
  view: YouTubeView
});
