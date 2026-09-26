import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { markdownResponse, renderLearnMarkdown } from '../../data/learnMarkdown';
import { learnSlug } from '../../components/learn/learnLocale';
import { isPluginLearnSlug } from '../../components/plugins/pluginLocale';

export const getStaticPaths = (async () => {
  const entries = await getCollection('learn');
  return entries
    .filter(entry => entry.data.locale === 'ko' && !entry.data.draft && !isPluginLearnSlug(learnSlug(entry.id)))
    .map(entry => ({ params: { slug: entry.id.replace(/\.(md|mdx)$/, '') }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => markdownResponse(renderLearnMarkdown(props.entry));
