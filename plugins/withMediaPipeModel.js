const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Copies MediaPipe face_landmarker.task into Android assets during prebuild.
 */
function withMediaPipeModel(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const src = path.join(projectRoot, 'assets', 'models', 'face_landmarker.task');
      const destDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets',
      );
      if (!fs.existsSync(src)) {
        console.warn(
          '[withMediaPipeModel] Missing assets/models/face_landmarker.task — download before prebuild.',
        );
        return cfg;
      }
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, 'face_landmarker.task'));
      return cfg;
    },
  ]);
}

module.exports = withMediaPipeModel;
