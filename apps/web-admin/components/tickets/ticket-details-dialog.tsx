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

export function TicketDetailsDialog({ ticket, open, onOpenChange, accessToken, onSuccess }: TicketDetailsDialogProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [sending, setSending] = useState(false)
    const [loadingComments, setLoadingComments] = useState(false)

    // Wrap fetchComments in useCallback to include in dependency array safely
    // But since it depends on 'ticket' and 'accessToken', we can just move it inside useEffect or define it before.
    // However, it's used in handleSendComment too.
    // Let's define it inside the component scope and add to deps, but satisfy linter. Or simple hack: add to deps.

    const fetchComments = async () => {
        if (!ticket) return
        setLoadingComments(true)
        try {
            const res = await fetch(`http://localhost:4000/tickets/${ticket.id}/comments`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            if (res.ok) {
                const data = await res.json()
                setComments(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingComments(false)
        }
    }

    useEffect(() => {
        if (ticket && open) {
            fetchComments()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticket, open])

    const handleSendComment = async () => {
        if (!newComment.trim() || !ticket) return
        setSending(true)
        try {
            const res = await fetch(`http://localhost:4000/tickets/${ticket.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ content: newComment })
            })
            if (res.ok) {
                setNewComment('')
                fetchComments()
                toast.success('Comment added')
            } else {
                toast.error('Failed to send comment')
            }
        } catch {
            toast.error('Error sending comment')
        } finally {
            setSending(false)
        }
    }

    const handleUpdateStatus = async (val: string) => {
        if (!ticket) return
        try {
            const res = await fetch(`http://localhost:4000/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status: val })
            })
            if (res.ok) {
                toast.success('Status updated')
                onSuccess()
            } else {
                toast.error('Failed to update status')
            }
        } catch {
            toast.error('Error updating status')
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

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Update Status</h4>
                            <Select defaultValue={ticket.status} onValueChange={handleUpdateStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
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
