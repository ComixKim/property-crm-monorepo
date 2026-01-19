'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CreateAccrualDialogProps {
    onSuccess: () => void
}

export function CreateAccrualDialog({ onSuccess }: CreateAccrualDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [properties, setProperties] = useState<{ id: string; title: string }[]>([])
    const supabase = createClient()

    const [formData, setFormData] = useState({
        property_id: '',
        category: 'utilities',
        amount: '',
        due_date: undefined as Date | undefined,
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
        description: ''
    })

    useEffect(() => {
        const fetchProperties = async () => {
            const { data } = await supabase.from('properties').select('id, title').eq('status', 'active')
            if (data) setProperties(data)
        }
        if (open) fetchProperties()
    }, [open, supabase])

    const handleSubmit = async () => {
        if (!formData.property_id || !formData.amount || !formData.due_date || !formData.description) {
            toast.error('Please fill required fields (Property, Amount, Due Date, Description)')
            return
        }

        setLoading(true)
        const { error } = await supabase.from('accruals').insert({
            property_id: formData.property_id,
            category: formData.category,
            amount: parseFloat(formData.amount),
            due_date: format(formData.due_date, 'yyyy-MM-dd'),
            period_start: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
            period_end: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
            description: formData.description,
            status: 'created'
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Accrual created')
            setOpen(false)
            setFormData({
                property_id: '',
                category: 'utilities',
                amount: '',
                due_date: undefined,
                start_date: undefined,
                end_date: undefined,
                description: ''
            })
            onSuccess()
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button suppressHydrationWarning>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Accrual
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Manual Accrual</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="utilities">Utilities</SelectItem>
                                    <SelectItem value="tax">Tax</SelectItem>
                                    <SelectItem value="service_fee">Service Fee</SelectItem>
                                    <SelectItem value="repair">Repair</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Amount ($)</Label>
                            <Input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Property</Label>
                        <Select value={formData.property_id} onValueChange={(val) => setFormData({ ...formData, property_id: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Property" />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="e.g., January Water Bill"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.due_date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.due_date ? format(formData.due_date, "PPP") : <span>Pick date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={formData.due_date} onSelect={(date) => setFormData({ ...formData, due_date: date })} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Period Start (Opt)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.start_date ? format(formData.start_date, "PPP") : <span>Pick date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.start_date} onSelect={(date) => setFormData({ ...formData, start_date: date })} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label>Period End (Opt)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.end_date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.end_date ? format(formData.end_date, "PPP") : <span>Pick date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.end_date} onSelect={(date) => setFormData({ ...formData, end_date: date })} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Accrual'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
