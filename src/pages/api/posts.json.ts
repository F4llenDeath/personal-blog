import { getAllPosts } from '@/lib/data-utils';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = 6;

  const allPosts = await getAllPosts();
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const paginatedPosts = allPosts.slice(start, end);

  return new Response(JSON.stringify(paginatedPosts), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};