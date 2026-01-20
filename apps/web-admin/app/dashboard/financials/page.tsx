'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, DollarSign } from 'lucide-react'
import { CreateAccrualDialog } from "@/components/financials/create-accrual-dialog"
import { AccrualDetailsSheet } from "@/components/financials/accrual-details-sheet"

interface Transaction {
    id: string
    due_date: string
    type: string
    category?: string
    description: string
    amount: number
    status: string
    properties?: {
        title: string
    }
}

export default function FinancialsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [selectedAccrual, setSelectedAccrual] = useState<Transaction | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const supabase = createClient()

    const fetchTransactions = useCallback(async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            setLoading(false)
            return
        }

        // Ideally fetch from API, but for direct DB access speed in admin:
        const { data, error } = await supabase
            .from('accruals')
            .select('*, properties(title)')
            .order('due_date', { ascending: false })

        if (data) {
            // Map to Transaction shape if needed, or just use as is
            setTransactions(data as any)
        } else if (error) {
            console.error('Error fetching transactions:', error)
            toast.error('Failed to fetch transactions')
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const handleGenerateAccruals = async () => {
        setProcessing(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const response = await fetch(`${apiUrl}/financials/accruals/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                toast.success("Accruals Generated successfully")
                fetchTransactions()
            } else {
                toast.error("Failed to generate accruals")
            }

        } catch (e) {
            toast.error("Error connecting to API")
        }
        setProcessing(false)
    }

    const getStatusVariant = (status: string, dueDate: string) => {
        if (status === 'paid') return 'default'
        if (new Date(dueDate) < new Date() && status !== 'paid') return 'destructive' // Overdue
        return 'secondary'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Financials</h2>
                <div className="flex gap-2">
                    <CreateAccrualDialog onSuccess={fetchTransactions} />
                    <Button onClick={handleGenerateAccruals} disabled={processing} variant="outline">
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <DollarSign className="mr-2 h-4 w-4" />
                        Generate Monthly Rent
                    </Button>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((tx) => (
                            <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedAccrual(tx); setIsSheetOpen(true); }}>
                                <TableCell>{tx.due_date}</TableCell>
                                <TableCell>{tx.properties?.title || 'Unknown'}</TableCell>
                                <TableCell className="capitalize">{tx.type?.replace('_', ' ') || tx.category}</TableCell>
                                <TableCell>{tx.description || '-'}</TableCell>
                                <TableCell className="text-right font-medium">
                                    ${tx.amount}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(tx.status, tx.due_date)}>
                                        {new Date(tx.due_date) < new Date() && tx.status !== 'paid' ? 'Overdue' : tx.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">
                                    View Details
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && transactions.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-24">No transactions found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>

            {selectedAccrual && (
                <AccrualDetailsSheet
                    accrualId={selectedAccrual.id}
                    isOpen={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    initialData={selectedAccrual}
                    onUpdate={fetchTransactions}
                />
            )}
        </div>
    )
}
