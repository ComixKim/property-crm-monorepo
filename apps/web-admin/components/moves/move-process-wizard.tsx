'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { startOfDay, format } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, Check, ChevronRight, Upload, Camera, ArrowRight, AlertTriangle } from "lucide-react"
import { toast } from 'sonner'

interface MoveProcessWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

const DEFAULT_CHECKLIST = [
    { item: 'Keys Handover', status: false, comment: '' },
    { item: 'Electricity Meter Read', status: false, comment: '' },
    { item: 'Water Meter Read', status: false, comment: '' },
    { item: 'Gas Meter Read', status: false, comment: '' },
    { item: 'Heating System Check', status: false, comment: '' },
    { item: 'Smoke Detectors Test', status: false, comment: '' },
    { item: 'Kitchen Appliances Clean', status: false, comment: '' },
    { item: 'Bathroom Fixtures Working', status: false, comment: '' },
    { item: 'Windows/Doors Lock Check', status: false, comment: '' },
    { item: 'Walls/Paint Condition', status: false, comment: '' },
]

export function MoveProcessWizard({ open, onOpenChange, onSuccess }: MoveProcessWizardProps) {
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Step 1: Data
    const [type, setType] = useState<'move_in' | 'move_out'>('move_in')
    const [propertyId, setPropertyId] = useState('')
    const [contractId, setContractId] = useState('')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [properties, setProperties] = useState<any[]>([])
    const [contracts, setContracts] = useState<any[]>([])

    // Step 2: Checklist
    const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)

    // Step 3: Media
    // Mock upload for now
    const [mediaCount, setMediaCount] = useState(0)

    // Step 4 (Move-Out): Baseline
    const [baselineId, setBaselineId] = useState<string | null>(null)
    const [deductions, setDeductions] = useState<any[]>([])

    useEffect(() => {
        if (open) {
            setStep(1)
            fetchProperties()
        }
    }, [open])

    const fetchProperties = async () => {
        const { data } = await supabase.from('properties').select('id, title').order('title')
        if (data) setProperties(data)
    }

    const fetchContracts = async (propId: string) => {
        const { data } = await supabase
            .from('contracts')
            .select('id, profiles(full_name)')
            .eq('property_id', propId)
            .in('status', ['active', 'signed', 'draft']) // Allowed statuses for moves
        if (data) setContracts(data)
    }

    const fetchBaseline = async (propId: string) => {
        // Find last move_in for this property
        const { data } = await supabase
            .from('inspections')
            .select('id, date')
            .eq('property_id', propId)
            .eq('type', 'move_in')
            .order('date', { ascending: false })
            .limit(1)
            .single()

        if (data) setBaselineId(data.id)
        else setBaselineId(null)
    }

    useEffect(() => {
        if (propertyId) {
            fetchContracts(propertyId)
            if (type === 'move_out') fetchBaseline(propertyId)
        }
    }, [propertyId, type])

    const handleNext = () => {
        if (step === 1 && (!propertyId || !contractId || !date)) {
            toast.error('Please complete all fields')
            return
        }
        setStep(step + 1)
    }

    const handleBack = () => setStep(step - 1)

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.from('inspections').insert({
                type,
                property_id: propertyId,
                contract_id: contractId,
                date: date?.toISOString(),
                status: 'completed',
                checklist: checklist,
                media: [], // would contain URLs
                deductions: type === 'move_out' ? deductions : undefined,
                baseline_id: baselineId
            })

            if (error) throw error
            toast.success('Process completed successfully')
            onOpenChange(false)
            onSuccess()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const updateChecklist = (index: number, field: string, value: any) => {
        const newChecklist = [...checklist]
        newChecklist[index] = { ...newChecklist[index], [field]: value }
        setChecklist(newChecklist)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{type === 'move_in' ? 'Move-In Process' : 'Move-Out Process'}</DialogTitle>
                    <DialogDescription>Step {step} of {type === 'move_out' ? 5 : 4}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Process Type</Label>
                                    <Select value={type} onValueChange={(val: any) => setType(val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="move_in">Move In</SelectItem>
                                            <SelectItem value="move_out">Move Out</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Property</Label>
                                <Select value={propertyId} onValueChange={setPropertyId}>
                                    <SelectTrigger><SelectValue placeholder="Select Property" /></SelectTrigger>
                                    <SelectContent>
                                        {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Contract / Tenant</Label>
                                <Select value={contractId} onValueChange={setContractId} disabled={!propertyId || contracts.length === 0}>
                                    <SelectTrigger disabled={!propertyId || contracts.length === 0}>
                                        <SelectValue placeholder={!propertyId ? "Select Property first" : (contracts.length === 0 ? "No active contracts found" : "Select Contract")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.profiles?.full_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Checklist</h3>
                            <div className="border rounded-md divide-y">
                                {checklist.map((item, idx) => (
                                    <div key={idx} className="p-3 flex items-start gap-3">
                                        <Checkbox
                                            checked={item.status}
                                            onCheckedChange={(checked) => updateChecklist(idx, 'status', checked)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 space-y-2">
                                            <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {item.item}
                                            </div>
                                            <Input
                                                placeholder="Comment / Condition"
                                                className="h-8 text-xs"
                                                value={item.comment}
                                                onChange={(e) => updateChecklist(idx, 'comment', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 text-center py-10">
                            <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Camera className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">Capture Evidence</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                Upload photos of meters, keys, and room conditions.
                            </p>
                            <Button variant="outline" onClick={() => {
                                setMediaCount(mediaCount + 1)
                                toast.success("Photo uploaded (simulated)")
                            }}>
                                <Upload className="mr-2 h-4 w-4" /> Upload Photo
                            </Button>
                            {mediaCount > 0 && <p className="text-sm font-medium text-green-600">{mediaCount} photos uploaded</p>}
                        </div>
                    )}

                    {step === 4 && type === 'move_out' && (
                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" /> Compare with Move-In
                            </h3>
                            {baselineId ? (
                                <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Baseline Inspection found from {format(new Date(), 'PP')} (Simulated date).
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div className="aspect-video bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">Move-In Photo</div>
                                        <div className="aspect-video bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">Current Photo</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-md flex items-center gap-2 text-yellow-700">
                                    <AlertTriangle className="h-4 w-4" /> No baseline Move-In inspection found.
                                </div>
                            )}

                            <div className="space-y-2 mt-4">
                                <Label>Deductions / Damages</Label>
                                <Textarea placeholder="List broken items or cleaning fees..." />
                            </div>
                        </div>
                    )}

                    {(step === 4 && type === 'move_in' || step === 5) && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Summary & Sign</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm bg-muted p-4 rounded-md">
                                <div>
                                    <span className="text-muted-foreground">Type:</span> <span className="capitalize font-medium">{type.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Date:</span> <span className="font-medium">{date ? format(date, 'PP') : '-'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Property:</span> <span className="font-medium">{properties.find(p => p.id === propertyId)?.title}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Manager Notes</Label>
                                <Textarea placeholder="Final comments..." />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <div className="flex-1 border-b-2 border-dashed h-16 flex items-end pb-2 text-sm text-muted-foreground">Tenant Signature</div>
                                <div className="flex-1 border-b-2 border-dashed h-16 flex items-end pb-2 text-sm text-muted-foreground">Manager Signature</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t flex justify-between bg-muted/10">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1}>Back</Button>
                    {((type === 'move_in' && step === 4) || (type === 'move_out' && step === 5)) ? (
                        <Button onClick={handleSubmit} disabled={loading}>Complete Process</Button>
                    ) : (
                        <Button onClick={handleNext}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
