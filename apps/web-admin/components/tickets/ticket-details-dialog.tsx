'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Ticket {
    id: string
    title: string
    description: string
    status: string
    priority: string
    created_at: string
}

interface TicketDetailsDialogProps {
    ticket: Ticket | null
    open: boolean
    onOpenChange: (open: boolean) => void
    accessToken: string
    onSuccess: () => void
}

interface Comment {
    id: string
    content: string
    created_at: string
    profiles?: {
        full_name: string
        email: string
    }
}

import { createClient } from '@/utils/supabase/client'

// ... existing interfaces ...
interface Profile {
    id: string
    full_name: string
    email: string
}

export function TicketDetailsDialog({ ticket, open, onOpenChange, accessToken, onSuccess }: TicketDetailsDialogProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [sending, setSending] = useState(false)
    const [loadingComments, setLoadingComments] = useState(false)
    const [serviceUsers, setServiceUsers] = useState<Profile[]>([])

    const supabase = createClient()

    useEffect(() => {
        const fetchServiceUsers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'service')

            if (data) setServiceUsers(data)
        }
        if (open) fetchServiceUsers()
    }, [open, supabase])

    // ... existing fetchComments ...

    const handleUpdateTicket = async (field: 'status' | 'assignee_id', value: string) => {
        if (!ticket) return
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ [field]: value })
            })
            if (res.ok) {
                toast.success(`${field === 'status' ? 'Status' : 'Assignee'} updated`)
                onSuccess()
            } else {
                toast.error('Failed to update')
            }
        } catch {
            toast.error('Error updating ticket')
        }
    }

    if (!ticket) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{ticket.title}</DialogTitle>
                    <DialogDescription>
                        Status: <span className="font-semibold capitalize">{ticket.status}</span> • Priority: <span className="font-semibold capitalize">{ticket.priority}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden pt-4">
                    <div className="flex flex-col space-y-4">
                        <div className="p-4 border rounded-md bg-muted/20">
                            <h4 className="font-semibold mb-2 text-sm">Description</h4>
                            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Assign To</h4>
                                <Select
                                    defaultValue={ticket.assignee_id || 'unassigned'}
                                    onValueChange={(val) => handleUpdateTicket('assignee_id', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Service User" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {serviceUsers.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Update Status</h4>
                                <Select defaultValue={ticket.status} onValueChange={(val) => handleUpdateTicket('status', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col h-full border-l pl-6">
                        <h4 className="font-semibold mb-4 text-sm">Discussion</h4>
                        <div className="flex-1 pr-4 mb-4 border rounded-md p-4 bg-background overflow-y-auto">
                            {loadingComments ?
                                <p className="text-sm text-center py-4 text-muted-foreground">Loading comments...</p> :
                                comments.length === 0 ?
                                    <p className="text-sm text-center py-4 text-muted-foreground">No comments yet</p> :
                                    comments.map((c: Comment) => (
                                        <div key={c.id} className="mb-4 last:mb-0">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                <span className="font-medium text-foreground">{c.profiles?.full_name || c.profiles?.email || 'Unknown'}</span>
                                                <span>{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <div className="bg-muted p-2 rounded-md text-sm whitespace-pre-wrap">
                                                {c.content}
                                            </div>
                                        </div>
                                    ))
                            }
                        </div>
                        <div className="space-y-2 mt-auto">
                            <Textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Type your reply..."
                                className="min-h-[80px]"
                            />
                            <Button size="sm" onClick={handleSendComment} disabled={sending} className="w-full">
                                {sending ? 'Sending...' : 'Post Comment'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
