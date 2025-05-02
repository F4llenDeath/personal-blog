export const languages = {
    en: 'English',
    zh: '中文',
} as const;

export const defaultLang = 'en';

export const ui = {
    en: {
        'home.seeAllPosts': 'See all posts',
        'nav.blog': 'Blog',
        'nav.publications': 'Publications',
        'nav.tags': 'Tags',
        'nav.gallery': 'Gallery',
        'gallery.back': 'Back',
        'blog.nextPost': 'Next Post',
        'blog.prevPost': 'Previous Post',
        'blog.latestPost': 'Latest post!',
        'blog.lastPost': 'Last post!',
        'breadcrumb.allPosts': 'All Posts',
        'blog.readTime': '{time} read',
        'tags.postsTaggedWith': 'Posts tagged with',
        'tags.collectionWith': 'A collection of posts tagged with',
    },
    zh: {
        'home.seeAllPosts': '查看全部文章',
        'nav.blog': '博客',
        'nav.publications': '学术成果',
        'nav.tags': '标签',
        'nav.gallery': '相片集',
        'gallery.back': '返回',
        'blog.nextPost': '下一篇',
        'blog.prevPost': '上一篇',
        'blog.latestPost': '最近一篇',
        'blog.lastPost': '最后一篇',
        'breadcrumb.allPosts': '所有文章',
        'blog.readTime': '阅读时间：{time}',
        'tags.postsTaggedWith': '包含该标签的文章',
        'tags.collectionWith': '所有使用了该标签的文章',
    },
} as const;

export const showDefaultLang = false;
