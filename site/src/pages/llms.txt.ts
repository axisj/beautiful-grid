import type { APIRoute } from 'astro';
import { renderLlmsText } from '../data/aiContext';

export const GET: APIRoute = async () => {
  return new Response(renderLlmsText(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    }
  });
};
