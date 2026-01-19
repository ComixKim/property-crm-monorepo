'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, LogOut, Loader2 } from 'lucide-react'

interface Profile {
    full_name: string
    email: string
    role: string
    created_at: string
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(data)
            setLoading(false)
        }
        getProfile()
    }, [router, supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return <div className="flex justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-2xl font-bold font-sans">Profile</h1>
            </header>

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle>{profile?.full_name || 'User'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        <div className="mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize">
                            {profile?.role || 'Tenant'}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
