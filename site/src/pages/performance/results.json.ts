import type { APIRoute } from 'astro';
import { performanceReport } from '../../data/performance/report';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(performanceReport, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
