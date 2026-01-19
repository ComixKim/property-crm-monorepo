'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { UserNav } from '@/components/user-nav'

interface Profile {
    full_name: string
    email: string
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile(data as Profile)
                }
            }
        }
        fetchProfile()
    }, [supabase])

    return (
        <div className="min-h-screen w-full bg-background relative">
            <DashboardSidebar />

            <div className="flex flex-col min-h-screen md:ml-20 transition-[margin] duration-300">
                <header className="flex h-14 items-center justify-between border-b bg-background/50 backdrop-blur-md px-6 lg:h-[60px] sticky top-0 z-40">
                    <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin Panel</h1>
                    <UserNav profile={profile} />
                </header>
                <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
