import type { APIRoute } from 'astro';
import { productFacts } from '../data/productFacts';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(productFacts, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
