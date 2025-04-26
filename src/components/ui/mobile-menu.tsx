import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ui } from '@/i18n/ui'
import { useTranslations } from '@/i18n/util'
import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  lang: string
}

const MobileMenu = ({ lang }: Props) => {
  const typedLang = lang as keyof typeof ui
  const t = useTranslations(typedLang)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleViewTransitionStart = () => {
      setIsOpen(false)
    }

    document.addEventListener('astro:before-swap', handleViewTransitionStart)

    return () => {
      document.removeEventListener(
        'astro:before-swap',
        handleViewTransitionStart,
      )
    }
  }, [])

  return (
    <DropdownMenu open={isOpen} onOpenChange={(val) => setIsOpen(val)}>
      <DropdownMenuTrigger asChild
        onClick={() => {
          setIsOpen((val) => !val);
        }}
      >
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          title="Menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        <DropdownMenuItem asChild>
          <a href={`${lang === 'en' ? '' : '/' + lang}/blog`} className="w-full text-lg font-medium capitalize">
            {t('nav.blog')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${lang === 'en' ? '' : '/' + lang}/publications`} className="w-full text-lg font-medium capitalize">
            {t('nav.publications')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${lang === 'en' ? '' : '/' + lang}/gallery`} className="w-full text-lg font-medium capitalize">
            {t('nav.gallery')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${lang === 'en' ? '' : '/' + lang}/tags`} className="w-full text-lg font-medium capitalize">
            {t('nav.tags')}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MobileMenu
