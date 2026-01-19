'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, User, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
    const pathname = usePathname()

    // Don't show nav on login
    if (pathname === '/login') return null

    const items = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/requests', label: 'Requests', icon: FileText },
        { href: '/financials', label: 'Financials', icon: PieChart },
        { href: '/profile', label: 'Profile', icon: User },
    ]

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl flex items-center justify-around z-50 pb-0">
            {items.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                            isActive ? "bg-primary/10 text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                    </Link>
                )
            })}
        </div>
    )
}
