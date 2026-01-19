'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Sparkles, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface CreateTicketDialogProps {
    onSuccess: () => void
}

export function CreateTicketDialog({ onSuccess }: CreateTicketDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [aiAnalyzing, setAiAnalyzing] = useState(false)
    const [properties, setProperties] = useState<{ id: string; title: string }[]>([])

    // AI Suggestions
    const [suggestion, setSuggestion] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        property_id: '',
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        access_instructions: '',
        due_date: undefined as Date | undefined
    })

    const supabase = createClient()

    useEffect(() => {
        const fetchProperties = async () => {
            const { data } = await supabase.from('properties').select('id, title').eq('status', 'active')
            if (data) setProperties(data)
        }
        if (open) fetchProperties()
    }, [open, supabase])

    // Simulated AI Keyword Matching
    const analyzeDescription = (text: string) => {
        setAiAnalyzing(true)
        setTimeout(() => {
            const lower = text.toLowerCase()
            let newPriority = 'medium'
            let newCategory = 'general'
            let advice = ''

            if (lower.includes('leak') || lower.includes('flood') || lower.includes('urgent') || lower.includes('fire')) {
                newPriority = 'urgent'
                newCategory = 'plumbing'
                advice = 'AI Suggestion: Detected urgent plumbing issue. Priority set to High.'
            } else if (lower.includes('light') || lower.includes('power') || lower.includes('electric')) {
                newCategory = 'electrical'
                if (lower.includes('stuck') || lower.includes('outage')) newPriority = 'high'
                advice = 'AI Suggestion: Electrical category detected.'
            } else if (lower.includes('lock') || lower.includes('key')) {
                newCategory = 'locksmith'
                advice = 'AI Suggestion: Locksmith category detected.'
            }

            if (advice) {
                setFormData(prev => ({ ...prev, priority: newPriority, category: newCategory }))
                setSuggestion(advice)
            } else {
                setSuggestion(null)
            }
            setAiAnalyzing(false)
        }, 800)
    }

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setFormData({ ...formData, description: val })
        // Debounce simple analysis
        if (val.length > 10) analyzeDescription(val)
    }

    const handleSubmit = async () => {
        if (!formData.property_id || !formData.title || !formData.description) {
            toast.error('Please fill required fields')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Calculate SLA Deadline implies backend logic, but we can set default based on priority here for display
            // In a real app, DB trigger or backend sets this. We will let DB default or set it.
            // Let's set a simple deadline: Urgent=24h, High=48h, Medium=72h, Low=1 week
            const hoursToAdd = formData.priority === 'urgent' ? 24 : formData.priority === 'high' ? 48 : formData.priority === 'medium' ? 72 : 168
            const deadline = new Date()
            deadline.setHours(deadline.getHours() + hoursToAdd)

            const { error } = await supabase.from('tickets').insert({
                title: formData.title,
                description: formData.description,
                property_id: formData.property_id,
                priority: formData.priority,
                category: formData.category,
                access_instructions: formData.access_instructions,
                status: 'new',
                reporter_id: user?.id,
                sla_deadline: deadline.toISOString()
            })

            if (error) throw error

            toast.success('Ticket created successfully')
            setOpen(false)
            setFormData({
                property_id: '',
                title: '',
                description: '',
                priority: 'medium',
                category: 'general',
                access_instructions: '',
                due_date: undefined
            })
            setSuggestion(null)
            onSuccess()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Ticket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Create Service Ticket</DialogTitle>
                    <DialogDescription>
                        Describe the issue. Our AI will help categorize it.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
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
                        <Label>Title</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Brief summary of the issue"
                        />
                    </div>

                    <div className="grid gap-2 relative">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            placeholder="Detailed explanation..."
                            className="min-h-[100px]"
                        />
                        {aiAnalyzing && (
                            <div className="absolute right-2 bottom-2 text-xs text-muted-foreground flex items-center animate-pulse">
                                <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
                                Analyzing...
                            </div>
                        )}
                    </div>

                    {suggestion && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex items-start text-sm text-blue-700 dark:text-blue-300">
                            <Sparkles className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                            {suggestion}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="plumbing">Plumbing</SelectItem>
                                    <SelectItem value="electrical">Electrical</SelectItem>
                                    <SelectItem value="hvac">HVAC</SelectItem>
                                    <SelectItem value="appliance">Appliance</SelectItem>
                                    <SelectItem value="locksmith">Locksmith</SelectItem>
                                    <SelectItem value="cleaning">Cleaning</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low (7 days)</SelectItem>
                                    <SelectItem value="medium">Medium (3 days)</SelectItem>
                                    <SelectItem value="high">High (48h)</SelectItem>
                                    <SelectItem value="urgent">Urgent (24h)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Access Instructions (Optional)</Label>
                        <Textarea
                            value={formData.access_instructions}
                            onChange={(e) => setFormData({ ...formData, access_instructions: e.target.value })}
                            placeholder="e.g., Key under mat, Code 1234, Call before arriving"
                        />
                    </div>

                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Ticket
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
