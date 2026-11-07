const React = require('react');
const { View } = require('react-native');

export const incomingShareImporterMock = () => ({
  IncomingShareImporter: function IncomingShareImporter() {
    return <View testID='IncomingShareImporter'></View>;
  },
});
