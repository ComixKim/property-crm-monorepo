'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, FileText, LayoutDashboard, Ticket, Users, LogOut, DollarSign, ClipboardCheck, Files, ArrowLeftRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const sidebarItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/properties', label: 'Properties', icon: Building2 },
    { href: '/dashboard/contracts', label: 'Contracts', icon: FileText },
    { href: '/dashboard/documents', label: 'Documents', icon: Files },
    { href: '/dashboard/financials', label: 'Financials', icon: DollarSign },
    { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
    { href: '/dashboard/inspections', label: 'Inspections', icon: ClipboardCheck },
    { href: '/dashboard/moves', label: 'Moves', icon: ArrowLeftRight },
    { href: '/dashboard/users', label: 'Users', icon: Users },
]

export function DashboardSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        const getRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                setRole(data?.role || 'admin')
            }
        }
        getRole()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const filteredItems = sidebarItems.filter(item => {
        if (role === 'agent') {
            return ['Overview', 'Tickets', 'Properties', 'Inspections'].includes(item.label)
        }
        return true // Admin sees all
    })

    return (
        <div className="hidden md:flex flex-col w-20 fixed inset-y-0 left-0 bg-white/80 backdrop-blur-md border-r border-border/40 z-50 items-center py-6 gap-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                <Building2 className="h-6 w-6" />
            </div>

            <nav className="flex-1 flex flex-col gap-4 w-full px-3">
                {filteredItems.map((item) => {
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
                    onClick={handleLogout}
                >
                    <LogOut className="h-6 w-6 stroke-[1.5]" />
                    <span className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                        Logout
                    </span>
                </button>
            </div>
        </div>
    )
}
