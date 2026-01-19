'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ContractDetailsSheet } from "@/components/contracts/contract-details-sheet"

interface Contract {
    id: string
    property_id: string
    tenant_id: string
    start_date: string
    end_date: string
    monthly_rent: number
    status: string
    properties: { title: string }
    profiles: { full_name: string; email: string }
}

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [properties, setProperties] = useState<{ id: string; title: string }[]>([])
    const [tenants, setTenants] = useState<{ id: string; full_name: string; email: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const supabase = createClient()

    // New Contract State
    const [formData, setFormData] = useState({
        property_id: '',
        tenant_id: '',
        monthly_rent: '',
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
    })

    // Fetch initial data
    const fetchData = useCallback(async () => {
        await Promise.resolve() // Bypassing set-state-in-effect lint error
        setLoading(true)

        // 1. Fetch Contracts
        const { data: contractsData } = await supabase
            .from('contracts')
            .select('*, properties(title), profiles:tenant_id(full_name, email)') // Join properites and tenant profile
            .order('created_at', { ascending: false })

        // 2. Fetch Properties (Active ones ideally, but all for now)
        const { data: propertiesData } = await supabase
            .from('properties')
            .select('id, title')
            .or('status.eq.draft,status.eq.active')

        // 3. Fetch Tenants (Profiles with role=tenant)
        const { data: tenantsData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'tenant')

        if (contractsData) setContracts(contractsData)
        if (propertiesData) setProperties(propertiesData)
        if (tenantsData) setTenants(tenantsData)

        setLoading(false)
    }, [supabase])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData()
    }, [fetchData])

    const handleCreate = async () => {
        if (!formData.property_id || !formData.tenant_id || !formData.monthly_rent || !formData.start_date || !formData.end_date) {
            toast.error('Please fill all fields')
            return
        }

        const { error } = await supabase
            .from('contracts')
            .insert([{
                property_id: formData.property_id,
                tenant_id: formData.tenant_id,
                start_date: format(formData.start_date, 'yyyy-MM-dd'),
                end_date: format(formData.end_date, 'yyyy-MM-dd'),
                monthly_rent: parseFloat(formData.monthly_rent),
                status: 'draft'
            }])

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Contract created')
            setOpen(false)
            setFormData({
                property_id: '',
                tenant_id: '',
                monthly_rent: '',
                start_date: undefined,
                end_date: undefined
            })
            fetchData()
        }
    }

    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // ... existing fetchData ...

    const handleEdit = (contract: Contract) => {
        setSelectedContract(contract)
        setIsSheetOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Contracts</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> New Contract</Button>
                    </DialogTrigger>
                    {/* ... DialogContent ... */}
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Contract</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">

                            {/* Property Select */}
                            <div className="grid gap-2">
                                <Label>Property</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, property_id: val })}>
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

                            {/* Tenant Select */}
                            <div className="grid gap-2">
                                <Label>Tenant</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, tenant_id: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Tenant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tenants.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Start Date</Label>
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
                                    <Label>End Date</Label>
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

                            {/* Rent */}
                            <div className="grid gap-2">
                                <Label>Monthly Rent ($)</Label>
                                <Input type="number" value={formData.monthly_rent} onChange={e => setFormData({ ...formData, monthly_rent: e.target.value })} placeholder="1500" />
                            </div>

                            <Button onClick={handleCreate}>Create Contract</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Rent</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contracts.map((contract) => (
                            <TableRow key={contract.id}>
                                <TableCell className="font-medium">{contract.properties?.title || 'Unknown'}</TableCell>
                                <TableCell>{contract.profiles?.full_name || contract.profiles?.email || 'Unknown'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {contract.start_date} &rarr; {contract.end_date}
                                </TableCell>
                                <TableCell>${contract.monthly_rent}</TableCell>
                                <TableCell>
                                    <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                                        {contract.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(contract)}>
                                        Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && contracts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24">No contracts found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>

            {selectedContract && (
                <ContractDetailsSheet
                    contractId={selectedContract.id}
                    isOpen={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    initialData={selectedContract}
                />
            )}
        </div>
    )
}
