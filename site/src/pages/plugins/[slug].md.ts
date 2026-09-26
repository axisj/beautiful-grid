import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { learnSlug } from '../../components/learn/learnLocale';
import { isPluginLearnSlug, pluginRouteSlug, type PluginLearnSlug } from '../../components/plugins/pluginLocale';
import { markdownResponse, renderLearnMarkdown } from '../../data/learnMarkdown';

export const getStaticPaths = (async () => (await getCollection('learn'))
  .filter(entry => {
    const slug = learnSlug(entry.id);
    return entry.data.locale === 'ko' && !entry.data.draft && isPluginLearnSlug(slug) && slug !== 'editor-plugins';
  })
  .map(entry => ({ params: { slug: pluginRouteSlug(learnSlug(entry.id) as PluginLearnSlug) }, props: { entry } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => markdownResponse(renderLearnMarkdown(props.entry));
