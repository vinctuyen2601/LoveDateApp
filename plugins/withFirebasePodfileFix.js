const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PATCH_MARKER = 'ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';

const PATCH_BLOCK = `
  # Fix: @react-native-firebase non-modular headers with use_frameworks! :static
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      build_config.build_settings['ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end
`;

const withFirebasePodfileFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');

      // Skip if already patched (idempotent)
      if (contents.includes(PATCH_MARKER)) {
        return config;
      }

      // Strategy 1: inject after "post_install do |installer|" line
      if (contents.includes('post_install do |installer|')) {
        contents = contents.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${PATCH_BLOCK}`
        );
      } else {
        // Strategy 2: append a new post_install block at end of file
        contents += `\npost_install do |installer|\n${PATCH_BLOCK}\nend\n`;
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};

module.exports = withFirebasePodfileFix;
