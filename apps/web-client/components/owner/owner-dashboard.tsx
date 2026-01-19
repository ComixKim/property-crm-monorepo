'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, DollarSign, Users } from 'lucide-react'
import { PropertyList } from './properties-list'
import { FinancialCharts } from './financial-charts'
import { createClient } from '@/utils/supabase/client'
import { NotificationBell } from '../notification-bell'
import { UserNav } from '../user-nav'
import { TicketDialog } from '@/components/tickets/ticket-dialog'

export function OwnerDashboard({ userId, profile }: {
    userId: string,
    profile: { full_name: string, email: string } | null
}) {
    const [stats, setStats] = useState({
        properties: 0,
        revenue: 0,
        occupancy: 0
    })
    const supabase = createClient()

    useEffect(() => {
        const fetchStats = async () => {
            // 1. Fetch Properties Count
            const { count: propertyCount } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })

            // 2. Fetch Active Contracts for Revenue & Occupancy
            // Ideally linked to owner's properties, but for now fetching all active contracts
            const { data: contracts } = await supabase
                .from('contracts')
                .select('monthly_rent')
                .eq('status', 'active')

            const revenue = contracts?.reduce((sum: number, contract: { monthly_rent: number }) => sum + (contract.monthly_rent || 0), 0) || 0
            const activeContracts = contracts?.length || 0

            // Calculate Occupancy: Active Contracts / Total Properties
            const occupancy = propertyCount ? Math.round((activeContracts / propertyCount) * 100) : 0

            setStats({
                properties: propertyCount || 0,
                revenue,
                occupancy
            })
        }
        fetchStats()
    }, [userId, supabase])

    const statItems = [
        { title: 'Total Properties', value: stats.properties.toString(), icon: Building, color: 'text-[oklch(0.78_0.15_265)]', bg: 'bg-[oklch(0.78_0.15_265)]/10' },
        { title: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-[oklch(0.88_0.12_85)]', bg: 'bg-[oklch(0.88_0.12_85)]/10' },
        { title: 'Occupancy Rate', value: `${stats.occupancy}%`, icon: Users, color: 'text-[oklch(0.85_0.1_150)]', bg: 'bg-[oklch(0.85_0.1_150)]/10' },
    ]

    return (
        <div className="space-y-8 p-8 relative">
            {/* Header Section */}
            <header className="flex justify-between items-center mb-0">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Hi, {profile?.full_name?.split(' ')[0] || 'Owner'}
                    </h1>
                </div>
                <div className="flex gap-4 items-center">
                    <NotificationBell />
                    <UserNav profile={profile} />
                </div>
            </header>


            {/* Quick Actions */}
            <div className="flex gap-4 overflow-x-auto pb-2">
                <TicketDialog
                    trigger={
                        <Button variant="outline" className="h-auto py-3 px-4 flex flex-col gap-2 min-w-[100px] border-dashed">
                            <span className="text-lg">＋</span>
                            <span className="text-xs font-normal">New Ticket</span>
                        </Button>
                    }
                />
                <Link href="/documents">
                    <Button variant="outline" className="h-auto py-3 px-4 flex flex-col gap-2 min-w-[100px]">
                        <span className="text-lg">📄</span>
                        <span className="text-xs font-normal">Documents</span>
                    </Button>
                </Link>
                <Button variant="outline" className="h-auto py-3 px-4 flex flex-col gap-2 min-w-[100px] opacity-50 cursor-not-allowed">
                    <span className="text-lg">💬</span>
                    <span className="text-xs font-normal">Chat</span>
                </Button>
            </div>

            {/* Stats Cards - Horizontal Scroll for Mobile friendliness if many, but grid is fine for 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statItems.map((stat, index) => (
                    <Card key={index} className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 bg-card">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                <h2 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h2>
                            </div>
                            <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground/90">Analytics</h2>
                <FinancialCharts />
            </section>

            {/* Properties List */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground/90">Your Properties</h2>
                    <Link href="/properties">
                        <Button variant="ghost" className="text-primary hover:text-primary/80">View All</Button>
                    </Link>
                </div>
                <PropertyList userId={userId} />
            </section>
        </div>
    )
}
