'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, User, Settings, PieChart, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
    const pathname = usePathname()

    // Don't show on login
    if (pathname === '/login') return null

    const items = [
        { href: '/', label: 'Dashboard', icon: Home },
        { href: '/requests', label: 'Requests', icon: FileText },
        { href: '/profile', label: 'Profile', icon: User },
        { href: '/financials', label: 'Financials', icon: PieChart },
    ]

    return (
        <aside className="hidden md:flex flex-col w-20 fixed inset-y-0 left-0 bg-white/80 backdrop-blur-md border-r border-border/40 z-50 items-center py-6 gap-8">
            {/* Logo / Brand Icon */}
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
                L
            </div>

            <nav className="flex-1 flex flex-col gap-4 w-full px-3">
                {items.map(item => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-center p-3 rounded-xl transition-all duration-300 group relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                    : "text-muted-foreground hover:bg-secondary/20 hover:text-secondary-foreground"
                            )}
                            title={item.label}
                        >
                            <Icon className={cn("h-6 w-6 stroke-[1.5]", isActive && "fill-current/20")} />

                            {/* Tooltip on hover */}
                            <span className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <div className="w-full px-3 pb-4">
                <button
                    className="flex items-center justify-center p-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group relative"
                    title="Logout"
                >
                    <LogOut className="h-6 w-6 stroke-[1.5]" />
                    <span className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    )
}
