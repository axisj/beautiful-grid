import { BGridPluginEditorConfig } from '../types';

export function defineEditorPlugin<T>(config: Omit<BGridPluginEditorConfig<T>, 'type'>): BGridPluginEditorConfig<T> {
  return {
    type: 'plugin',
    ...config,
  };
}
