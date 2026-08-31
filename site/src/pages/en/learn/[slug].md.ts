import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { markdownResponse, renderLearnMarkdown } from '../../../data/learnMarkdown';

export const getStaticPaths = (async () => {
  const entries = await getCollection('learn');
  return entries
    .filter(entry => entry.data.locale === 'en' && !entry.data.draft)
    .map(entry => ({ params: { slug: entry.id.replace(/^en\//, '').replace(/\.(md|mdx)$/, '') }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => markdownResponse(renderLearnMarkdown(props.entry));
