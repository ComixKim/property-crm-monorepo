'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationBell } from '@/components/notification-bell'
import { UserNav } from '@/components/user-nav'

interface AgentDashboardProps {
    userId: string
    profile: any
}

export function AgentDashboard({ userId, profile }: AgentDashboardProps) {
    return (
        <div className="p-4 space-y-6">
            <header className="flex items-center justify-between pb-2">
                <div>
                    <h1 className="text-2xl font-bold font-sans">Agent Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Your properties and performance</p>
                </div>
                <div className="flex gap-2 items-center">
                    <NotificationBell />
                    <UserNav profile={profile} />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>My Properties</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">List of assigned units...</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">KPIs and Revenue Share...</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
