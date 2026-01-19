'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationBell } from '@/components/notification-bell'
import { UserNav } from '@/components/user-nav'

interface ServiceDashboardProps {
    userId: string
    profile: any
}

export function ServiceDashboard({ userId, profile }: ServiceDashboardProps) {
    return (
        <div className="p-4 space-y-6">
            <header className="flex items-center justify-between pb-2">
                <div>
                    <h1 className="text-2xl font-bold font-sans">Service Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Your assigned tasks</p>
                </div>
                <div className="flex gap-2 items-center">
                    <NotificationBell />
                    <UserNav profile={profile} />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                <Card>
                    <CardHeader><CardTitle>My Assigned Tasks</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">List of tasks/tickets...</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
