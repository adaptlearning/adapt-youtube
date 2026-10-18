import { describe, getCourse, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, getComponents, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('adapt-youtube - 3.3.5 to 3.3.6', async () => {
  let youtubes;

  whereFromPlugin('adapt-youtube - from 3.3.5', { name: 'adapt-youtube', version: '<3.3.6' });

  whereContent('adapt-youtube - where youtube with invalid _media._aspectRatio or _media._progressColor', async content => {
    youtubes = getComponents('youtube').filter(c => {
      const hasStringAspectRatio = _.has(c, '_media._aspectRatio') && typeof c._media._aspectRatio === 'string' && _.isFinite(_.toNumber(c._media._aspectRatio));
      const hasDefaultProgressColor = _.has(c, '_media._progressColor') && c._media._progressColor === 'default';
      return hasStringAspectRatio || hasDefaultProgressColor;
    });
    return youtubes.length;
  });

  mutateContent('adapt-youtube - coerce _media._aspectRatio string to number', async content => {
    youtubes.forEach(youtube => {
      if (!_.has(youtube, '_media._aspectRatio')) return;
      if (typeof youtube._media._aspectRatio !== 'string') return;
      const coerced = _.toNumber(youtube._media._aspectRatio);
      if (_.isFinite(coerced)) youtube._media._aspectRatio = coerced;
    });
    return true;
  });

  checkContent('adapt-youtube - check _media._aspectRatio is not a coercible string', async content => {
    const isInvalid = youtubes.some(youtube => {
      if (!_.has(youtube, '_media._aspectRatio')) return false;
      if (typeof youtube._media._aspectRatio !== 'string') return false;
      return _.isFinite(_.toNumber(youtube._media._aspectRatio));
    });
    if (isInvalid) throw new Error('adapt-youtube - _media._aspectRatio is still a coercible string on one or more youtube components');
    return true;
  });

  mutateContent('adapt-youtube - replace _media._progressColor default with red', async content => {
    youtubes.forEach(youtube => {
      if (!_.has(youtube, '_media._progressColor')) return;
      if (youtube._media._progressColor !== 'default') return;
      youtube._media._progressColor = 'red';
    });
    return true;
  });

  checkContent('adapt-youtube - check _media._progressColor is not default', async content => {
    const isInvalid = youtubes.some(youtube => _.has(youtube, '_media._progressColor') && youtube._media._progressColor === 'default');
    if (isInvalid) throw new Error('adapt-youtube - _media._progressColor is still default on one or more youtube components');
    return true;
  });

  updatePlugin('adapt-youtube - update to 3.3.6', { name: 'adapt-youtube', version: '3.3.6', framework: '>=5.19.1' });

  testSuccessWhere('youtube with string _aspectRatio coercible to number', {
    fromPlugins: [{ name: 'adapt-youtube', version: '3.3.5' }],
    content: [{ _id: 'c-100', _component: 'youtube', _media: { _aspectRatio: '1.778', _progressColor: 'red' } }]
  });

  testSuccessWhere('youtube with string _aspectRatio 1.33', {
    fromPlugins: [{ name: 'adapt-youtube', version: '3.3.5' }],
    content: [{ _id: 'c-100', _component: 'youtube', _media: { _aspectRatio: '1.33', _progressColor: 'red' } }]
  });

  testSuccessWhere('youtube with _progressColor set to default', {
    fromPlugins: [{ name: 'adapt-youtube', version: '3.3.5' }],
    content: [{ _id: 'c-100', _component: 'youtube', _media: { _aspectRatio: 1.778, _progressColor: 'default' } }]
  });

  testSuccessWhere('mixed: one component needs both fixes, one needs only aspectRatio, one needs only progressColor', {
    fromPlugins: [{ name: 'adapt-youtube', version: '3.3.5' }],
    content: [
      { _id: 'c-100', _component: 'youtube', _media: { _aspectRatio: '1.778', _progressColor: 'default' } },
      { _id: 'c-105', _component: 'youtube', _media: { _aspectRatio: '1.33', _progressColor: 'white' } },
      { _id: 'c-110', _component: 'youtube', _media: { _aspectRatio: 1.778, _progressColor: 'default' } }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-youtube', version: '3.3.6' }]
  });

  testStopWhere('no youtube components with invalid properties', {
    fromPlugins: [{ name: 'adapt-youtube', version: '3.3.5' }],
    content: [
      { _id: 'c-100', _component: 'youtube', _media: { _aspectRatio: 1.778, _progressColor: 'red' } },
      { _id: 'c-105', _component: 'youtube', _media: { _aspectRatio: 1.33, _progressColor: 'white' } },
      { _id: 'c-110', _component: 'youtube' },
      { _component: 'other' }
    ]
  });

  testStopWhere('no youtube components', {
    fromPlugins: [{ name: 'adapt-youtube', version: '3.3.5' }],
    content: [{ _component: 'other' }]
  });
});

describe('adapt-youtube - @@CURRENT_VERSION to @@RELEASE_VERSION', async () => {
  let course;

  whereFromPlugin('adapt-youtube - from @@CURRENT_VERSION', { name: 'adapt-youtube', version: '<@@RELEASE_VERSION' });

  whereContent('adapt-youtube - where course has flat _globals._youtube', async content => {
    course = getCourse();
    return _.has(course, '_globals._youtube');
  });

  mutateContent('adapt-youtube - move _globals._youtube to _globals._components._youtube', async content => {
    const flat = course._globals._youtube;
    const nested = _.get(course, '_globals._components._youtube');
    _.set(course, '_globals._components._youtube', { ...(_.isPlainObject(nested) ? nested : {}), ...(_.isPlainObject(flat) ? flat : {}) });
    delete course._globals._youtube;
    return true;
  });

  checkContent('adapt-youtube - check _globals._youtube moved to _globals._components._youtube', async content => {
    if (_.has(course, '_globals._youtube')) throw new Error('adapt-youtube - _globals._youtube was not removed');
    if (!_.isPlainObject(_.get(course, '_globals._components._youtube'))) throw new Error('adapt-youtube - _globals._components._youtube was not created');
    return true;
  });

  updatePlugin('adapt-youtube - update to @@RELEASE_VERSION', { name: 'adapt-youtube', version: '@@RELEASE_VERSION', framework: '>=5.19.1' });

  testSuccessWhere('course with flat _globals._youtube', {
    fromPlugins: [{ name: 'adapt-youtube', version: '@@CURRENT_VERSION' }],
    content: [
      { _id: 'c-100', _component: 'youtube' },
      { _type: 'course', _globals: { _youtube: { ariaRegion: 'Custom region', skipToTranscript: 'Custom skip' } } }
    ]
  });

  testSuccessWhere('course with flat and nested _globals._youtube, flat values win', {
    fromPlugins: [{ name: 'adapt-youtube', version: '@@CURRENT_VERSION' }],
    content: [
      { _id: 'c-100', _component: 'youtube' },
      { _type: 'course', _globals: { _youtube: { skipToTranscript: 'Edited skip' }, _components: { _youtube: { ariaRegion: 'Nested region', skipToTranscript: 'Nested skip' } } } }
    ]
  });

  testStopWhere('course with nested _globals._components._youtube only', {
    fromPlugins: [{ name: 'adapt-youtube', version: '@@CURRENT_VERSION' }],
    content: [
      { _id: 'c-100', _component: 'youtube' },
      { _type: 'course', _globals: { _components: { _youtube: { skipToTranscript: 'Skip to transcript' } } } }
    ]
  });

  testStopWhere('course with no _globals', {
    fromPlugins: [{ name: 'adapt-youtube', version: '@@CURRENT_VERSION' }],
    content: [
      { _id: 'c-100', _component: 'youtube' },
      { _type: 'course' }
    ]
  });

  testStopWhere('plugin not installed', {
    fromPlugins: [{ name: 'adapt-contrib-text', version: '1.0.0' }],
    content: [
      { _type: 'course', _globals: { _youtube: { skipToTranscript: 'Edited skip' } } }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-youtube', version: '@@RELEASE_VERSION' }]
  });
});
