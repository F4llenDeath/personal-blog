import { getCollection, type CollectionEntry } from 'astro:content'
import { defaultLang } from '@/i18n/ui'

export async function getAllPosts(lang: string = defaultLang): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')
  return posts
    .filter(
      (post) =>
        !post.data.draft &&
        ((post.data.lang ?? defaultLang) === lang)
    )
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function getRecentPosts(
  count: number,
  lang: string = defaultLang,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts(lang)
  return posts.slice(0, count)
}

export async function getAdjacentPosts(currentId: string, lang: string = defaultLang): Promise<{
  prev: CollectionEntry<'blog'> | null
  next: CollectionEntry<'blog'> | null
}> {
  const posts = await getAllPosts(lang)
  const currentIndex = posts.findIndex((post) => post.id === currentId)

  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  return {
    next: currentIndex > 0 ? posts[currentIndex - 1] : null,
    prev: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null,
  }
}

export async function getAllTags(lang: string = defaultLang): Promise<Map<string, number>> {
  const posts = await getAllPosts(lang)

  return posts.reduce((acc, post) => {
    post.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getSortedTags(lang: string = defaultLang): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllTags(lang)

  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export function groupPostsByYear(
  posts: CollectionEntry<'blog'>[],
): Record<string, CollectionEntry<'blog'>[]> {
  return posts.reduce(
    (acc: Record<string, CollectionEntry<'blog'>[]>, post) => {
      const year = post.data.date.getFullYear().toString()
      ;(acc[year] ??= []).push(post)
      return acc
    },
    {},
  )
}

export async function getPostsByTag(
  tag: string,
  lang: string = defaultLang,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts(lang)
  return posts.filter((post) => post.data.tags?.includes(tag))
}
