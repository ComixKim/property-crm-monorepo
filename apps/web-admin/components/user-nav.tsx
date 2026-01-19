'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { useEffect, useState } from "react"

interface UserNavProps {
    profile: {
        full_name: string
        email: string
    } | null
}

export function UserNav({ profile }: UserNavProps) {
    const supabase = createClient()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : 'U'

    if (!isMounted) {
        return (
            <Button variant="ghost" className="relative h-8 w-8 rounded-full border">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full border">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {profile?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <button className="w-full flex items-center" onClick={() => router.push('/dashboard/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
