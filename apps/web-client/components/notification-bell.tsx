'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
    id: string
    title: string
    message: string
    is_read: boolean
    created_at: string
    type: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    const fetchNotifications = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        }
    }, [supabase])

    // Subscribe to real-time notifications
    useEffect(() => {
        let channel: RealtimeChannel;

        const setupSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Initial fetch
            fetchNotifications()

            // Subscribe
            channel = supabase
                .channel(`user-notifications-${session.user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${session.user.id}`,
                    },
                    (payload) => {
                        console.log('New notification received:', payload)
                        const newNotif = payload.new as Notification
                        setNotifications((prev) => [newNotif, ...prev])
                        setUnreadCount((prev) => prev + 1)
                        toast.info(`New Notification: ${newNotif.title}`)
                    }
                )
                .subscribe()
        }

        setupSubscription()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [supabase, fetchNotifications])

    const markAsRead = async (id: string, event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })

            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Failed to mark read', error)
        }
    }

    const markAllRead = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            await fetch(`http://localhost:4000/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
            toast.success('All marked as read')
        } catch (error) {
            console.error('Failed to mark all read', error)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllRead}>
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer focus:bg-muted/50" onSelect={(e) => e.preventDefault()}>
                                <div className="flex flex-col gap-1 w-full" onClick={(e) => !notification.is_read && markAsRead(notification.id, e)}>
                                    <div className="flex justify-between items-start gap-2">
                                        <span className={cn("font-medium text-sm", !notification.is_read && "text-primary")}>
                                            {notification.title}
                                        </span>
                                        {!notification.is_read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground text-right">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
