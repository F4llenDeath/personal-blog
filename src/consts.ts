import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'F4llenDeath',
  description:
    '',
  href: 'https://astro-erudite.vercel.app',
  author: 'F4llenDeath',
  locale: 'en-US',
  featuredPostCount: 2,
  postsPerPage: 3,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: 'blog',
  },
  //{
  //  href: '/authors',
  //  label: 'authors',
  //},
  {
    href: '/publications',
    label: 'publications',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/F4llenDeath',
    label: 'GitHub',
  },
  {
    href: 'https://www.instagram.com/f4llend/',
    label: 'Instagram',
  },
  {
    href: 'mailto:yangxicheng2022@outlook.com',
    label: 'Email',
  },
  {
    href: 'https://500px.com/p/f4llen',
    label: '500px',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
  "500px": 'lucide:aperture',
  Instagram: 'lucide:instagram',
}
