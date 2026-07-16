// @ts-nocheck
import { describe, getCourse, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, getComponents, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('adapt-youtube - v1.0.2 to v1.2.0', async () => {
  let course, youtubes, youtubesWithoutControls, youtubesWithoutAllowFullscreen, youtubesWithoutTranscript;

  whereFromPlugin('adapt-youtube - from v1.0.2', { name: 'adapt-youtube', version: '>=1.0.0 <1.2.0' });

  whereContent('adapt-youtube - where youtube', async content => {
    course = getCourse();
    youtubes = getComponents('youtube');
    youtubesWithoutControls = youtubes.filter(c => !_.has(c, '_media._controls'));
    youtubesWithoutAllowFullscreen = youtubes.filter(c => !_.has(c, '_media._allowFullscreen'));
    youtubesWithoutTranscript = youtubes.filter(c => !_.has(c, '_transcript'));
    const hasTranscriptButton = _.has(course, '_globals._youtube.transcriptButton');
    return hasTranscriptButton || youtubesWithoutControls.length || youtubesWithoutAllowFullscreen.length || youtubesWithoutTranscript.length;
  });

  mutateContent('adapt-youtube - rename global transcriptButton to skipToTranscript', async content => {
    if (!_.has(course, '_globals._youtube.transcriptButton')) return true;
    const transcriptButton = course._globals._youtube.transcriptButton;
    _.set(course, '_globals._youtube.skipToTranscript', transcriptButton);
    delete course._globals._youtube.transcriptButton;
    return true;
  });

  checkContent('adapt-youtube - check transcriptButton renamed to skipToTranscript', async content => {
    if (_.has(course, '_globals._youtube.transcriptButton')) throw new Error('adapt-youtube - _globals._youtube.transcriptButton was not removed');
    return true;
  });

  mutateContent('adapt-youtube - add _media._controls to youtube components', async content => {
    youtubesWithoutControls.forEach(c => _.set(c, '_media._controls', true));
    return true;
  });

  checkContent('adapt-youtube - check _media._controls added', async content => {
    const isInvalid = youtubesWithoutControls.some(c => !_.has(c, '_media._controls'));
    if (isInvalid) throw new Error('adapt-youtube - _media._controls not added to one or more youtube components');
    return true;
  });

  mutateContent('adapt-youtube - add _media._allowFullscreen to youtube components', async content => {
    youtubesWithoutAllowFullscreen.forEach(c => _.set(c, '_media._allowFullscreen', true));
    return true;
  });

  checkContent('adapt-youtube - check _media._allowFullscreen added', async content => {
    const isInvalid = youtubesWithoutAllowFullscreen.some(c => !_.has(c, '_media._allowFullscreen'));
    if (isInvalid) throw new Error('adapt-youtube - _media._allowFullscreen not added to one or more youtube components');
    return true;
  });

  mutateContent('adapt-youtube - add _transcript to youtube components', async content => {
    youtubesWithoutTranscript.forEach(c => _.set(c, '_transcript', {}));
    return true;
  });

  checkContent('adapt-youtube - check _transcript added', async content => {
    const isInvalid = youtubesWithoutTranscript.some(c => !_.has(c, '_transcript'));
    if (isInvalid) throw new Error('adapt-youtube - _transcript not added to one or more youtube components');
    return true;
  });

  updatePlugin('adapt-youtube - update to v1.2.0', { name: 'adapt-youtube', version: '1.2.0', framework: '>=3.3' });

  testSuccessWhere('youtube with transcriptButton global and missing _media properties', {
    fromPlugins: [{ name: 'adapt-youtube', version: '1.0.2' }],
    content: [{ _type: 'course', _globals: { _youtube: { transcriptButton: 'Skip to transcript' } } }, { _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw' } }]
  });

  testSuccessWhere('youtube without transcriptButton global and missing _transcript', {
    fromPlugins: [{ name: 'adapt-youtube', version: '1.0.2' }],
    content: [{ _type: 'course', _globals: { _youtube: {} } }, { _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw', _controls: true, _allowFullscreen: true } }]
  });

  testSuccessWhere('multiple youtubes mixed: some missing controls, some missing allowFullscreen, some missing transcript', {
    fromPlugins: [{ name: 'adapt-youtube', version: '1.1.0' }],
    content: [
      { _type: 'course', _globals: { _youtube: { transcriptButton: 'Skip' } } },
      { _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw' } },
      { _id: 'c-105', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw', _controls: true, _allowFullscreen: true }, _transcript: {} },
      { _id: 'c-110', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw', _controls: true } }
    ]
  });

  testSuccessWhere('youtube with transcriptButton only - no components need property updates', {
    fromPlugins: [{ name: 'adapt-youtube', version: '1.0.2' }],
    content: [{ _type: 'course', _globals: { _youtube: { transcriptButton: 'Skip to transcript' } } }, { _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw', _controls: true, _allowFullscreen: true }, _transcript: {} }]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-youtube', version: '1.2.0' }]
  });

  testStopWhere('youtube already has all properties - no migration needed', {
    fromPlugins: [{ name: 'adapt-youtube', version: '1.0.2' }],
    content: [{ _type: 'course', _globals: { _youtube: {} } }, { _id: 'c-100', _component: 'youtube', _media: { _source: '//www.youtube.com/embed/jNQXAC9IVRw', _controls: true, _allowFullscreen: true }, _transcript: {} }]
  });

  testStopWhere('no youtube components', {
    fromPlugins: [{ name: 'adapt-youtube', version: '1.0.2' }],
    content: [{ _type: 'course' }, { _component: 'other' }]
  });
});
