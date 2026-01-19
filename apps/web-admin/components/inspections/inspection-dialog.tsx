'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
    property_id: z.string().uuid('Please select a property'),
    date: z.date(),
    notes: z.string().optional(),
})

interface InspectionDialogProps {
    onSuccess: () => void
    accessToken?: string
}

interface Property {
    id: string
    title: string
}

export function InspectionDialog({ onSuccess, accessToken }: InspectionDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [properties, setProperties] = useState<Property[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchProperties = async () => {
            const { data } = await supabase.from('properties').select('id, title').eq('status', 'active')
            if (data) setProperties(data)
        }
        if (open) fetchProperties()
    }, [open, supabase])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            notes: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!accessToken) {
            toast.error('You must be logged in')
            return
        }
        setLoading(true)
        try {
            const response = await fetch('http://localhost:4000/inspections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    property_id: values.property_id,
                    date: values.date.toISOString(),
                    notes: values.notes
                }),
            })

            if (!response.ok) {
                const errorData = await response.text()
                throw new Error(errorData || 'Failed to schedule inspection')
            }

            toast.success('Inspection scheduled successfully')
            form.reset()
            setOpen(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Schedule Inspection</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule Inspection</DialogTitle>
                    <DialogDescription>
                        Plan a new property inspection.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                            {properties.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date()
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Notes about the inspection..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Scheduling...' : 'Schedule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
