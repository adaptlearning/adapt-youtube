import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, getComponents, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('adapt-youtube - v2.1.0 to v2.1.1', async () => {
  let youtubes;

  whereFromPlugin('adapt-youtube - from v2.1.0', { name: 'adapt-youtube', version: '>=2.1.0 <2.1.1' });

  whereContent('adapt-youtube - where youtube with _media but without _media._playsinline', async content => {
    youtubes = getComponents('youtube').filter(c => _.has(c, '_media') && !_.has(c, '_media._playsinline'));
    return youtubes.length;
  });

  mutateContent('adapt-youtube - add _media._playsinline to youtube components', async content => {
    youtubes.forEach(c => (c._media._playsinline = false));
    return true;
  });

  checkContent('adapt-youtube - check _media._playsinline added', async content => {
    const isInvalid = youtubes.some(c => !_.has(c, '_media._playsinline'));
    if (isInvalid) throw new Error('adapt-youtube - _media._playsinline not added to one or more youtube components');
    return true;
  });

  updatePlugin('adapt-youtube - update to v2.1.1', { name: 'adapt-youtube', version: '2.1.1', framework: '>=5.8.0' });

  testSuccessWhere('youtube with _media but without _playsinline', {
    fromPlugins: [{ name: 'adapt-youtube', version: '2.1.0' }],
    content: [{ _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw' } }]
  });

  testSuccessWhere('multiple youtubes: some with _media missing _playsinline, some already have it', {
    fromPlugins: [{ name: 'adapt-youtube', version: '2.1.0' }],
    content: [
      { _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw' } },
      { _id: 'c-105', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/abc123', _playsinline: true } },
      { _id: 'c-110', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/def456' } }
    ]
  });

  testSuccessWhere('youtube with _media missing _playsinline alongside non-youtube component', {
    fromPlugins: [{ name: 'adapt-youtube', version: '2.1.0' }],
    content: [{ _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw' } }, { _id: 'c-105', _component: 'other' }]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-youtube', version: '2.1.1' }]
  });

  testStopWhere('all youtube components already have _media._playsinline', {
    fromPlugins: [{ name: 'adapt-youtube', version: '2.1.0' }],
    content: [{ _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw', _playsinline: false } }]
  });

  testStopWhere('youtube components without _media (guard prevents adding _playsinline)', {
    fromPlugins: [{ name: 'adapt-youtube', version: '2.1.0' }],
    content: [{ _id: 'c-100', _component: 'youtube' }]
  });

  testStopWhere('no youtube components', {
    fromPlugins: [{ name: 'adapt-youtube', version: '2.1.0' }],
    content: [{ _component: 'other' }]
  });
});
