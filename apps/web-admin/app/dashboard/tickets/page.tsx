'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog'
import { TicketDetailsSheet } from '@/components/tickets/ticket-details-sheet'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Clock, Search, Filter } from 'lucide-react'

interface Ticket {
    id: string
    title: string
    description: string
    status: string
    priority: string
    category: string
    created_at: string
    sla_deadline: string
    properties?: {
        title: string
    }
    profiles?: {
        full_name: string
        email: string
    }
    assignee?: {
        full_name: string
    }
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const supabase = createClient()

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const fetchTickets = useCallback(async () => {
        setLoading(true)

        let query = supabase
            .from('tickets')
            .select(`
                *,
                properties (title),
                profiles:reporter_id (full_name, email),
                assignee:assignee_id (full_name)
            `)
            .order('created_at', { ascending: false })

        if (statusFilter !== 'all') query = query.eq('status', statusFilter)
        if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter)

        const { data, error } = await query

        if (error) {
            console.error('Error fetching tickets:', error)
            toast.error('Failed to fetch tickets')
        } else {
            // Client-side search for simplicity
            let filtered = data as any[]
            if (searchTerm) {
                const lower = searchTerm.toLowerCase()
                filtered = filtered.filter(t =>
                    t.title.toLowerCase().includes(lower) ||
                    t.properties?.title.toLowerCase().includes(lower) ||
                    t.profiles?.full_name?.toLowerCase().includes(lower)
                )
            }
            setTickets(filtered)
        }
        setLoading(false)
    }, [supabase, statusFilter, priorityFilter, searchTerm])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    const getSLAIndicator = (deadline: string | null, status: string) => {
        if (!deadline) return null
        if (status === 'resolved' || status === 'closed') return null

        const isPast = new Date() > new Date(deadline)
        if (isPast) {
            return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> SLA Breach</Badge>
        }

        // Warning if < 4 hours left
        const hoursLeft = (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60)
        if (hoursLeft < 4) {
            return <Badge variant="outline" className="text-orange-500 border-orange-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Risk</Badge>
        }

        return null
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Service Tickets</h2>
                    <p className="text-muted-foreground">Manage maintenance requests and issues.</p>
                </div>
                <CreateTicketDialog onSuccess={fetchTickets} />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="classified">Classified</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={fetchTickets}>
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>SLA</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.map((ticket) => (
                            <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedTicketId(ticket.id); setIsSheetOpen(true); }}>
                                <TableCell>
                                    <div className="font-medium">{ticket.title}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{ticket.category}</div>
                                </TableCell>
                                <TableCell>{ticket.properties?.title || 'Unknown'}</TableCell>
                                <TableCell>
                                    <div className="text-sm">{ticket.profiles?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">{ticket.profiles?.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        ticket.priority === 'urgent' ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20' :
                                            ticket.priority === 'high' ? 'border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''
                                    }>
                                        {ticket.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={ticket.status === 'open' ? 'destructive' : ticket.status === 'resolved' ? 'default' : 'secondary'} className="capitalize">
                                        {ticket.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {getSLAIndicator(ticket.sla_deadline, ticket.status)}
                                        {ticket.sla_deadline && ticket.status !== 'resolved' && (
                                            <span className="text-xs text-muted-foreground">
                                                By {new Date(ticket.sla_deadline).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">
                                    Manage &rarr;
                                </TableCell>
                            </TableRow>
                        ))}
                        {loading && <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground"><div className="flex items-center justify-center gap-2">Loading tickets...</div></TableCell></TableRow>}
                        {!loading && tickets.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground">No tickets found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>

            <TicketDetailsSheet
                ticketId={selectedTicketId}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onUpdate={fetchTickets}
            />
        </div>
    )
}
