import * as _ from 'lodash';
import { extractFullPath } from '@console/internal-integration-tests';
import {
  PluginPackage,
  filterActivePluginPackages,
  PluginPackageFilter,
  resolvePluginPackages,
} from './plugin-resolver';

/**
 * Return an object representing Protractor test suites collected from all plugins.
 */
export const getPluginIntegrationTests = (
  monorepoRootDir: string = process.cwd(),
  pluginFilter: PluginPackageFilter = filterActivePluginPackages,
) => {
  const integrationTests = (plugin: PluginPackage) =>
    plugin.consolePlugin.integrationTests &&
    _.mapValues(plugin.consolePlugin.integrationTests, (paths) =>
      _.map(paths, (path) => extractFullPath(path, plugin.path)),
    );

  const plugins = resolvePluginPackages(monorepoRootDir, pluginFilter);
  const pluginTests = plugins.reduce(
    (map, plugin) => Object.assign(map, integrationTests(plugin)),
    {},
  );

  return _.pickBy(pluginTests, (tests) => !!tests);
};
