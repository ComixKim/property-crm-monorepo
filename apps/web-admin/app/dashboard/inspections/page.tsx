'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { InspectionDialog } from '@/components/inspections/inspection-dialog'
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
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

interface Inspection {
    id: string
    property_id: string
    agent_id: string
    date: string
    status: string
    notes: string
    properties?: {
        title: string
        address: string
    }
    profiles?: {
        full_name: string
        email: string
    }
}

export default function InspectionsPage() {
    const [inspections, setInspections] = useState<Inspection[]>([])
    const [loading, setLoading] = useState(true)
    const [accessToken, setAccessToken] = useState<string>('')
    const supabase = createClient()

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) setAccessToken(session.access_token)
        }
        getSession()
    }, [supabase.auth])

    const fetchInspections = useCallback(async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            setLoading(false)
            return
        }

        try {
            const response = await fetch('http://localhost:4000/inspections', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setInspections(data)
            } else {
                console.error('Failed to fetch inspections:', await response.text())
                toast.error('Failed to fetch inspections')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error connecting to API')
        } finally {
            setLoading(false)
        }
    }, [supabase.auth])

    useEffect(() => {
        fetchInspections()
    }, [fetchInspections])

    // Helper to update status (simple version for MVP, later full dialog)
    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`http://localhost:4000/inspections/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status })
            })
            if (res.ok) {
                toast.success(`Inspection marked as ${status}`)
                fetchInspections()
            } else {
                toast.error('Failed to update status')
            }
        } catch {
            toast.error('Error updating status')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inspections</h2>
                    <p className="text-muted-foreground">Manage and schedule property inspections.</p>
                </div>
                <InspectionDialog onSuccess={fetchInspections} accessToken={accessToken} />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inspections.map((inspection) => (
                            <TableRow key={inspection.id}>
                                <TableCell className="font-medium">
                                    <div>{inspection.properties?.title || 'Unknown Property'}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{inspection.properties?.address}</div>
                                </TableCell>
                                <TableCell>{inspection.profiles?.full_name || inspection.profiles?.email || 'Unassigned'}</TableCell>
                                <TableCell>{format(new Date(inspection.date), 'PPP')}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{inspection.notes || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        inspection.status === 'scheduled' ? 'secondary' :
                                            inspection.status === 'completed' ? 'default' : 'outline'
                                    }>
                                        {inspection.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {inspection.status === 'scheduled' && (
                                        <Button size="sm" variant="outline" onClick={() => updateStatus(inspection.id, 'completed')}>
                                            Mark Complete
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {loading && <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>}
                        {!loading && inspections.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24">No inspections found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
