const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PATCH_MARKER = 'ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';

const PATCH_BLOCK = `
  # Fix: @react-native-firebase non-modular headers with use_frameworks! :static
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      build_config.build_settings['ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end

  # Also fix the main project build settings
  installer.pods_project.build_configurations.each do |build_config|
    build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    build_config.build_settings['ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
  end

  # Disable treating warnings as errors for RNFB pods
  installer.pods_project.targets.each do |target|
    if target.name.start_with?('RNFB') || target.name.start_with?('RNFBApp') || target.name.start_with?('RNFBAnalytics')
      target.build_configurations.each do |build_config|
        build_config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
        existing_flags = build_config.build_settings['OTHER_CFLAGS'] || '$(inherited)'
        unless existing_flags.include?('-Wno-non-modular-include-in-framework-module')
          build_config.build_settings['OTHER_CFLAGS'] = "#{existing_flags} -Wno-non-modular-include-in-framework-module"
        end
      end
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
