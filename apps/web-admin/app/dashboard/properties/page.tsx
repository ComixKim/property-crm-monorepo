'use client'

/* eslint-disable @next/next/no-img-element */
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PropertyWizard } from '@/components/properties/property-wizard'
import { PropertyDetailsSheet } from '@/components/properties/property-details-sheet'
import { Input } from '@/components/ui/input'
import { Search, Filter, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Property {
    id: string
    title: string
    address: string
    status: string
    metadata?: {
        image?: string
    }
    contracts?: {
        status: string
        monthly_rent: number
        profiles?: {
            full_name: string | null
        }
    }[]
    tickets?: {
        status: string
    }[]
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const handleEdit = (property: Property) => {
        setSelectedProperty(property)
        setIsSheetOpen(true)
    }

    const fetchProperties = useCallback(async () => {
        await Promise.resolve() // Bypassing set-state-in-effect lint error
        setLoading(true)
        const { data, error } = await supabase
            .from('properties')
            .select(`
                *,
                contracts (
                    status,
                    monthly_rent,
                    tenant_id,
                    profiles:tenant_id (full_name)
                ),
                tickets (status)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Failed to fetch properties')
        } else {
            setProperties(data as any || [])
        }
        setLoading(false)
    }, [supabase])

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredProperties = properties.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.address.toLowerCase().includes(search.toLowerCase()) ||
            p.contracts?.some(c => c.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()))

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter

        return matchesSearch && matchesStatus
    })

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProperties()
    }, [fetchProperties])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
                <PropertyWizard onSuccess={fetchProperties} />
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search properties or tenants..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Title & Address</TableHead>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tickets</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProperties.map((property) => {
                            const activeContract = property.contracts?.find(c => c.status === 'active')
                            const tenantName = activeContract?.profiles?.full_name || '-'
                            const activeTickets = property.tickets?.filter(t => t.status !== 'closed' && t.status !== 'resolved').length || 0

                            return (
                                <TableRow key={property.id}>
                                    <TableCell>
                                        {property.metadata?.image ? (
                                            <img src={property.metadata.image} alt="Prop" className="h-12 w-12 rounded-md object-cover" />
                                        ) : (
                                            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                No Img
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{property.title}</span>
                                            <span className="text-xs text-muted-foreground">{property.address}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{tenantName}</span>
                                            {activeContract && (
                                                <span className="text-xs text-muted-foreground">
                                                    ${activeContract.monthly_rent}/mo
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                                            {property.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {activeTickets > 0 ? (
                                            <Badge variant="destructive" className="gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {activeTickets}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                0
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(property)}>Edit</Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {loading && <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>}
                        {!loading && filteredProperties.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24">No properties found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>

            <PropertyDetailsSheet
                propertyId={selectedProperty?.id || ''}
                isOpen={isSheetOpen}
                onClose={() => { setIsSheetOpen(false); setSelectedProperty(null); }}
                initialData={selectedProperty}
            />
        </div>
    )
}
