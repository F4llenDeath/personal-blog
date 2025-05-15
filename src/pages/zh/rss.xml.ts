import { SITE } from '@/consts'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts } from '@/lib/data-utils'

export async function GET(context: APIContext) {
  try {
    const posts = await getAllPosts('zh')
    const items = posts.map((post) => {
      const html = post.rendered?.html
      const parts = post.id.split('/')
      const slug = parts.length > 1 ? parts.slice(0, -1).join('/') : post.id
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/zh/blog/${slug}/`,
        content: html,
      }
    })
    return rss({
      title: `${SITE.title} (中文)`,
      description: SITE.description,
      site: context.site ?? SITE.href,
      items,
    })
  } catch (error) {
    console.error('Error generating RSS feed (zh):', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}