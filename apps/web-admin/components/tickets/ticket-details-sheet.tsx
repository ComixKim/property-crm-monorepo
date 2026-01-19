'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from '@/components/ui/separator'
import {
    Clock,
    MessageSquare,
    History,
    CheckCircle2,
    AlertTriangle,
    User,
    Send,
    FileText,
    Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface TicketDetailsSheetProps {
    ticketId: string | null
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
}

export function TicketDetailsSheet({ ticketId, isOpen, onClose, onUpdate }: TicketDetailsSheetProps) {
    const supabase = createClient()
    const [ticket, setTicket] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    // Optimization: combine fetches
    const fetchData = useCallback(async () => {
        if (!ticketId) return

        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id || null)

        // Fetch Ticket
        const { data: ticketData, error } = await supabase
            .from('tickets')
            .select('*, properties(title), profiles:reporter_id(full_name, email)')
            .eq('id', ticketId)
            .single()

        if (error) {
            toast.error('Error fetching ticket')
            return
        }
        setTicket(ticketData)

        // Fetch Messages
        const { data: msgs } = await supabase
            .from('ticket_messages')
            .select('*, profiles:sender_id(full_name)')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true })
        if (msgs) setMessages(msgs)

        // Fetch History
        const { data: hist } = await supabase
            .from('ticket_history')
            .select('*, profiles:changed_by(full_name)')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: false })
        if (hist) setHistory(hist)

    }, [ticketId, supabase])

    useEffect(() => {
        if (isOpen) fetchData()

        // Subscribe to real-time changes
        if (!isOpen || !ticketId) return

        const channel = supabase
            .channel(`ticket-${ticketId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` },
                () => fetchData()) // simplistic refresh
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` },
                () => fetchData())
            .subscribe()

        return () => { supabase.removeChannel(channel) }

    }, [isOpen, ticketId, fetchData, supabase])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !userId) return
        setSending(true)
        const { error } = await supabase.from('ticket_messages').insert({
            ticket_id: ticketId,
            sender_id: userId,
            message: newMessage
        })
        if (error) toast.error('Failed to send')
        else setNewMessage('')
        setSending(false)
    }

    const handleStatusChange = async (newStatus: string) => {
        const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', ticketId)
        if (error) toast.error('Failed to update status')
        else {
            toast.success(`Status updated to ${newStatus}`)
            // Log history manually or rely on triggers (we didn't set triggers, so do manual)
            await supabase.from('ticket_history').insert({
                ticket_id: ticketId,
                changed_by: userId,
                change_type: 'status_change',
                old_value: ticket.status,
                new_value: newStatus
            })
            onUpdate()
            fetchData()
        }
    }

    // SLA Calculation
    const getSLAStatus = () => {
        if (!ticket?.sla_deadline) return { text: 'No SLA', color: 'text-muted-foreground', icon: Clock }

        const deadline = new Date(ticket.sla_deadline)
        const now = new Date()
        const isPast = now > deadline

        if (ticket.status === 'resolved' || ticket.status === 'closed') {
            return { text: 'SLA Met', color: 'text-green-500', icon: CheckCircle2 }
        }

        if (isPast) {
            return { text: `Overdue by ${formatDistanceToNow(deadline)}`, color: 'text-red-500', icon: AlertTriangle }
        } else {
            return { text: `Due in ${formatDistanceToNow(deadline)}`, color: 'text-orange-500', icon: Clock }
        }
    }

    if (!ticket) return null

    const sla = getSLAStatus()

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[600px] flex flex-col p-0">
                <div className="p-6 border-b bg-muted/10">
                    <SheetHeader>
                        <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="uppercase text-xs tracking-wider">{ticket.priority}</Badge>
                            <Badge className={cn("capitalize",
                                ticket.status === 'new' ? 'bg-blue-500' :
                                    ticket.status === 'in_progress' ? 'bg-orange-500' :
                                        ticket.status === 'resolved' ? 'bg-green-500' : 'bg-secondary'
                            )}>{ticket.status.replace('_', ' ')}</Badge>
                        </div>
                        <SheetTitle className="text-2xl font-bold">{ticket.title}</SheetTitle>
                        <SheetDescription className="flex items-center gap-2 mt-1">
                            <sla.icon className={cn("h-4 w-4", sla.color)} />
                            <span className={cn("font-medium", sla.color)}>{sla.text}</span>
                            <span className="text-muted-foreground mx-2">•</span>
                            <span>{ticket.properties?.title}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-4">
                        {ticket.status === 'new' && (
                            <Button size="sm" onClick={() => handleStatusChange('classified')}>Classify / Assign</Button>
                        )}
                        {ticket.status === 'classified' && (
                            <Button size="sm" onClick={() => handleStatusChange('assigned')}>Assign Service</Button>
                        )}
                        {ticket.status === 'assigned' && userId /* Check if service user logic later */ && (
                            <Button size="sm" onClick={() => handleStatusChange('in_progress')}>Start Work</Button>
                        )}
                        {ticket.status === 'in_progress' && (
                            <Button size="sm" onClick={() => handleStatusChange('resolved')} className="bg-green-600 hover:bg-green-700">Resolve Issue</Button>
                        )}
                        {ticket.status === 'resolved' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange('closed')}>Close Ticket</Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        <TabsList className="w-full justify-start rounded-none border-b px-6 h-12 bg-transparent">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full">Overview</TabsTrigger>
                            <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full">Chat</TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full">History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                                <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed">
                                    {ticket.description}
                                </div>
                            </div>

                            {ticket.access_instructions && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Access Instructions</h3>
                                    <div className="p-3 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 rounded-md text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                        {ticket.access_instructions}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 border rounded-md">
                                        <p className="text-xs text-muted-foreground">Category</p>
                                        <p className="font-medium capitalize">{ticket.category}</p>
                                    </div>
                                    <div className="p-3 border rounded-md">
                                        <p className="text-xs text-muted-foreground">Reporter</p>
                                        <p className="font-medium">{ticket.profiles?.full_name}</p>
                                    </div>
                                    <div className="p-3 border rounded-md">
                                        <p className="text-xs text-muted-foreground">Created</p>
                                        <p className="font-medium">{format(new Date(ticket.created_at), 'PPP')}</p>
                                    </div>
                                    <div className="p-3 border rounded-md">
                                        <p className="text-xs text-muted-foreground">Assignee</p>
                                        <p className="font-medium">{ticket.assignee_id ? 'Assigned' : 'Unassigned'}</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="chat" className="flex-1 flex flex-col h-full overflow-hidden">
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender_id === userId ? "ml-auto items-end" : "items-start")}>
                                            <div className={cn("px-4 py-2 rounded-2xl text-sm",
                                                msg.sender_id === userId ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                                            )}>
                                                {msg.message}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                                {format(new Date(msg.created_at), 'p')} • {msg.profiles?.full_name?.split(' ')[0]}
                                            </span>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <div className="text-center text-muted-foreground text-sm py-10">
                                            No messages yet. Start the conversation.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                            <div className="p-4 border-t bg-background flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <Button size="icon" onClick={handleSendMessage} disabled={sending}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="flex-1 overflow-y-auto p-6">
                            <div className="relative border-l ml-2 space-y-6 pl-6 pb-2">
                                {history.map((item) => (
                                    <div key={item.id} className="relative">
                                        <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border bg-background" />
                                        <div className="text-sm">
                                            <span className="font-medium">{item.profiles?.full_name}</span>
                                            <span className="text-muted-foreground mx-1">
                                                {item.change_type === 'status_change' ? 'changed status' : 'updated ticket'}
                                            </span>
                                        </div>
                                        {item.old_value && item.new_value && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {item.old_value} &rarr; <span className="font-medium text-foreground">{item.new_value}</span>
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(item.created_at))} ago
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    )
}
