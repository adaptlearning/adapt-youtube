import components from 'core/js/components';
import ComponentModel from 'core/js/models/componentModel';
import YouTubeView from './YouTubeView';

export default components.register('youtube', {
  model: ComponentModel.extend({}),
  view: YouTubeView
});
