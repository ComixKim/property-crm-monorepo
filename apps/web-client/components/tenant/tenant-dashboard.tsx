'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, CreditCard, Ticket as TicketIcon } from 'lucide-react'
import { format } from 'date-fns'
import { NotificationBell } from '@/components/notification-bell'
import { TicketDialog } from '@/components/tickets/ticket-dialog'
import { UserNav } from '@/components/user-nav'

interface Profile {
    full_name: string
    email: string
    role?: string
}

interface Contract {
    id: string
    monthly_rent: number
    properties: {
        id: string
        title: string
        address: string
    }
}

interface TenantDashboardProps {
    contract: Contract | null
    profile: Profile | null
}

export function TenantDashboard({ contract, profile }: TenantDashboardProps) {
    if (!contract) {
        return (
            <div className="p-4 flex flex-col items-center justify-center pt-20 text-center space-y-4">
                <Home className="h-16 w-16 text-muted-foreground/30" />
                <h2 className="text-xl font-semibold">No Active Lease</h2>
                <p className="text-muted-foreground">You don&apos;t have any active rental contracts linked to this account.</p>
                <div className="flex gap-2 items-center mt-4">
                    <UserNav profile={profile} />
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            <header className="flex items-center justify-between pb-2">
                <div>
                    <h1 className="text-2xl font-bold font-sans">My Home</h1>
                    <p className="text-muted-foreground text-sm">{contract.properties.title}</p>
                </div>
                <div className="flex gap-2 items-center">
                    <NotificationBell />
                    <UserNav profile={profile} />
                </div>
            </header>

            {/* Address Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 flex gap-4 items-center">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <Home className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Address</div>
                        <div className="font-bold text-lg">{contract.properties.address}</div>
                    </div>
                </CardContent>
            </Card>

            {/* Rent Card */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">Next Rent Payment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">${contract.monthly_rent}</div>
                    <div className="text-sm opacity-80 mt-1">Due {format(new Date(), "MMMM '1st'")}</div>
                    <Link href="/payments">
                        <Button variant="secondary" className="w-full mt-6 font-semibold shadow-sm">Pay Now</Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <TicketDialog
                    trigger={
                        <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center h-32">
                                <TicketIcon className="h-8 w-8 text-blue-500" />
                                <span className="font-medium">File Request</span>
                            </CardContent>
                        </Card>
                    }
                    propertyId={contract.properties.id}
                />
                <Link href="/payments">
                    <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                        <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center h-32">
                            <CreditCard className="h-8 w-8 text-green-500" />
                            <span className="font-medium">Payment History</span>
                        </CardContent>
                    </Card>
                </Link>
            </div>

        </div>
    )
}
