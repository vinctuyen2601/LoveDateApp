const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PATCH_MARKER = '# RNFB_PATCHED';

const PRE_INSTALL_BLOCK = `
${PATCH_MARKER}
# Force React-Native-Firebase pods to build as static libraries (not frameworks)
# This avoids modular header import errors with use_frameworks! :static
$RNFirebaseAsStaticFramework = true

pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name.start_with?('RNFB')
      def pod.build_type
        Pod::BuildType.static_library
      end
    end
  end
end
`;

const POST_INSTALL_BLOCK = `
  # Fix: @react-native-firebase non-modular headers
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'

      if target.name.start_with?('RNFB')
        build_config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
        existing_flags = build_config.build_settings['OTHER_CFLAGS'] || '$(inherited)'
        unless existing_flags.include?('-Wno-error')
          build_config.build_settings['OTHER_CFLAGS'] = "\#{existing_flags} -Wno-error -Wno-non-modular-include-in-framework-module"
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

      // Inject pre_install block before the first "target" declaration
      if (contents.includes("target '")) {
        contents = contents.replace(
          /target '/,
          `${PRE_INSTALL_BLOCK}\ntarget '`
        );
      } else {
        // Fallback: prepend after use_frameworks line
        contents = PRE_INSTALL_BLOCK + '\n' + contents;
      }

      // Inject post_install block
      if (contents.includes('post_install do |installer|')) {
        contents = contents.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${POST_INSTALL_BLOCK}`
        );
      } else {
        contents += `\npost_install do |installer|\n${POST_INSTALL_BLOCK}\nend\n`;
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};

module.exports = withFirebasePodfileFix;
