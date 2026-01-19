'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    property_id: z.string().uuid('Please select a property'),
})

interface TicketDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
    propertyId?: string // Optional pre-selected property
    trigger?: React.ReactNode
}

export function TicketDialog({ open: controlledOpen, onOpenChange: setControlledOpen, onSuccess, propertyId, trigger }: TicketDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = setControlledOpen || setInternalOpen

    const [loading, setLoading] = useState(false)
    const [properties, setProperties] = useState<{ id: string, title: string }[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchProperties = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get user role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            const role = profile?.role || 'tenant'
            let allProps: { id: string, title: string }[] = []

            if (role === 'owner' || role === 'manager' || role === 'admin_uk') {
                // For owners/managers, fetch ALL properties to match the dashboard listing
                // (which relies on RLS to filter or shows all if authorized)
                const { data } = await supabase
                    .from('properties')
                    .select('id, title')

                if (data) allProps = data
            } else {
                // For tenants, strictly fetch from active contracts
                const { data: rentedContracts } = await supabase
                    .from('contracts')
                    .select('properties(id, title)')
                    .eq('tenant_id', user.id)
                    .eq('status', 'active')

                const rentedProps = rentedContracts?.map((c: any) => c.properties).filter(Boolean) || []
                allProps = rentedProps
            }

            // Deduplicate and sort
            const uniqueProps = Array.from(new Map(allProps.map(item => [item.id, item])).values())
            uniqueProps.sort((a, b) => a.title.localeCompare(b.title))

            setProperties(uniqueProps)
        }
        if (open && !propertyId) fetchProperties()
    }, [open, propertyId, supabase])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'medium',
            property_id: propertyId || '',
        },
    })

    // Update property_id in form if prop changes
    useEffect(() => {
        if (propertyId) {
            form.setValue('property_id', propertyId)
        }
    }, [propertyId, form])


    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            toast.error('You must be logged in to create a ticket')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    title: values.title,
                    description: values.description,
                    priority: values.priority,
                    property_id: values.property_id,
                })
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || 'Failed to create ticket')
            }

            toast.success('Ticket created successfully')
            form.reset()
            setOpen(false)
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error(error)
            const message = error instanceof Error ? error.message : 'Something went wrong';
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Report Issue</DialogTitle>
                    <DialogDescription>
                        Create a maintenance ticket for this property.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Leaking tap" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Only show property select if not pre-selected */}
                        {!propertyId && (
                            <FormField
                                control={form.control}
                                name="property_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Property</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a property" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {properties.map((p: { id: string, title: string }) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe the issue..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
