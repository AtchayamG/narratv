const React = require('react');
const { View } = require('react-native');

const Video = React.forwardRef((props, ref) => {
  return React.createElement(View, {
    testID: props.testID || 'native-video-player',
    ...props,
    ref
  });
});

module.exports = Video;
module.exports.default = Video;
module.exports.Video = Video;
