export const languages = {
    en: 'English',
    zh: '中文',
} as const;

export const defaultLang = 'en';

export const ui = {
    en: {
        'nav.blog': 'Blog',
        'nav.publications': 'Publications',
        'nav.tags': 'Tags',
        'breadcrumb.allPosts': 'All Posts',
        'blog.readTime': '{time} read',
    },
    zh: {
        'nav.blog': '博客',
        'nav.publications': '学术成果',
        'nav.tags': '标签',
        'breadcrumb.allPosts': '所有文章',
        'blog.readTime': '阅读时间：{time}',
    },
} as const;

export const showDefaultLang = false;
