const fs = require('fs');
const { expect: jestExpect } = require('@jest/globals');
const { toMatchImageSnapshot } = require('jest-image-snapshot');
jestExpect.extend({ toMatchImageSnapshot });

const { device } = require('detox');

function getBaselineImage(testName) {
  const deviceName = device.name;

  const path = `./screenshots/${deviceName}/baseline/${testName}.png`;
  if (!fs.existsSync(path)) {
    return false;
  }
  return path;
}

async function compareScreens(element, name) {
  let path = await element.takeScreenshot(name);
  const bitmapBuffer = fs.readFileSync(path);
  jestExpect(bitmapBuffer).toMatchImageSnapshot({
    failureThreshold: 200,
    failureThresholdType: 'pixel',
    customSnapshotIdentifier: name,
  });
}

module.exports = {
  compareScreens,
};
