const fs = require('fs');
const path = require('path');
/**
 * Look ma, it's cp -R.
 * @param {string} src  The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
const copyRecursiveSync = function (src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

module.exports = async function (hookArgs) {
  if (hookArgs.platformData.platform === 'ios') return;
  const androidTestDir = path.join(hookArgs.projectData.projectDir, 'platforms/android/app/src/androidTest');
  if (fs.existsSync(androidTestDir))
    fs.rmdirSync(androidTestDir, {
      recursive: true,
      force: true,
    });

  copyRecursiveSync(path.join(hookArgs.projectData.projectDir, 'scripts/androidTest'), path.join(hookArgs.projectData.projectDir, 'platforms/android/app/src/androidTest'));
};
