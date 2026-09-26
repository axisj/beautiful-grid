import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { learnSlug } from '../../components/learn/learnLocale';
import { markdownResponse, renderLearnMarkdown } from '../../data/learnMarkdown';

export const GET: APIRoute = async () => {
  const entry = (await getCollection('learn')).find(item => item.data.locale === 'en' && learnSlug(item.id) === 'editor-plugins');
  if (!entry) return new Response('Not found', { status: 404 });
  return markdownResponse(renderLearnMarkdown(entry));
};
