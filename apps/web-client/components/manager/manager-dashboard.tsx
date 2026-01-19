'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationBell } from '@/components/notification-bell'
import { UserNav } from '@/components/user-nav'

interface ManagerDashboardProps {
    userId: string
    profile: any
}

export function ManagerDashboard({ userId, profile }: ManagerDashboardProps) {
    return (
        <div className="p-4 space-y-6">
            <header className="flex items-center justify-between pb-2">
                <div>
                    <h1 className="text-2xl font-bold font-sans">Manager Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Overview of all operations</p>
                </div>
                <div className="flex gap-2 items-center">
                    <NotificationBell />
                    <UserNav profile={profile} />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle>Ticket Queue</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">List of open tickets by SLA...</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Move In/Out</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">Upcoming moves...</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Financials</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">Overdue payments...</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
