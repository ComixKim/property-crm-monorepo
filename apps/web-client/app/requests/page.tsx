'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { TicketDialog } from '@/components/tickets/ticket-dialog'
import { Button } from '@/components/ui/button'

interface Ticket {
    id: string
    title: string
    status: string
    description: string
    created_at: string
}

export default function RequestsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    const fetchTickets = useCallback(async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/my`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setTickets(data)
            }
        } catch (error) {
            console.error('Failed to fetch tickets', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, router])

    useEffect(() => {
        fetchTickets()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Requests</h1>
                <TicketDialog
                    onSuccess={fetchTickets}
                    trigger={<Button size="sm">New Request</Button>}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="space-y-3">
                    {tickets.length === 0 && <p className="text-muted-foreground text-center py-10">No active requests.</p>}
                    {tickets.map(ticket => (
                        <Card key={ticket.id}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{ticket.title}</CardTitle>
                                    <Badge variant={
                                        ticket.status === 'new' ? 'default' :
                                            ticket.status === 'resolved' ? 'secondary' :
                                                ticket.status === 'in_progress' ? 'destructive' : 'outline'
                                    } className="capitalize">
                                        {ticket.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                                {ticket.description}
                                <div className="mt-2 text-xs opacity-70">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

