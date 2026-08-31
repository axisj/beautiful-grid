import type { APIRoute } from 'astro';
import { renderApiReferenceMarkdown } from '../../../data/apiReferenceMarkdown';
import { markdownResponse } from '../../../data/learnMarkdown';

export const GET: APIRoute = () => markdownResponse(renderApiReferenceMarkdown('en'));
