# My personal website  
This site is based off the free [astro-erudite](https://github.com/jktrn/astro-erudite) template from [enscribe](https://enscribe.dev/). It's built with [Astro](https://astro.build/).

Website avaiable at [www.f4llendeath.me](www.f4llendeath.me).

## Modifications I've made
1. Natively support i18n with help of this [guide](https://docs.astro.build/en/recipes/i18n/).
2. Added a photo gallery page basing on [Tailwind Columns utilities](https://tailwindcss.com/docs/columns), with help of this [blog](https://jankraus.net/2024/04/05/how-to-build-a-simple-photo-gallery-with-astro/).
    1. Integrated [PhotoSwipe](https://photoswipe.com) referring to [astro-photoswipe](https://github.com/petrovicz/astro-photoswipe) repo. 
3. Added a removeOriginalImages.ts and loaded as an integration to solve [Issue#4961](https://github.com/withastro/astro/issues/4961) of Astro.
