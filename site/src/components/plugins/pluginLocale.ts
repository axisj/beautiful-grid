import { localizePath, type Locale } from '../../i18n';

export const pluginLearnSlugs = [
  'editor-plugins',
  'editor-plugins-custom',
  'editor-plugins-antd',
  'editor-plugins-shadcn',
  'editor-plugins-mui',
  'editor-plugins-mantine',
] as const;

export type PluginLearnSlug = (typeof pluginLearnSlugs)[number];

export const pluginMessages = {
  ko: {
    sectionTitle: '에디터 플러그인',
    overview: '플러그인 개요',
    navigation: '플러그인 탐색',
    breadcrumb: '이동 경로',
    previous: '이전 플러그인',
    next: '다음 플러그인',
    pagination: '플러그인 페이지 이동',
  },
  en: {
    sectionTitle: 'Editor Plugins',
    overview: 'Plugin overview',
    navigation: 'Plugin navigation',
    breadcrumb: 'Breadcrumb',
    previous: 'Previous plugin',
    next: 'Next plugin',
    pagination: 'Plugin pagination',
  },
} as const;

export function isPluginLearnSlug(slug: string): slug is PluginLearnSlug {
  return pluginLearnSlugs.includes(slug as PluginLearnSlug);
}

export function pluginRouteSlug(learnSlug: PluginLearnSlug): string {
  return learnSlug === 'editor-plugins' ? '' : learnSlug.replace('editor-plugins-', '');
}

export function pluginLearnSlug(routeSlug: string): PluginLearnSlug | null {
  const candidate = routeSlug ? `editor-plugins-${routeSlug}` : 'editor-plugins';
  return isPluginLearnSlug(candidate) ? candidate : null;
}

export function pluginPath(learnSlug: PluginLearnSlug, locale: Locale): string {
  const routeSlug = pluginRouteSlug(learnSlug);
  return localizePath(routeSlug ? `/plugins/${routeSlug}` : '/plugins', locale);
}

export function pluginMarkdownPath(learnSlug: PluginLearnSlug, locale: Locale): string {
  return `${pluginPath(learnSlug, locale)}.md`;
}
