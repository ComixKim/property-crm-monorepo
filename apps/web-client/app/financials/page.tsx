'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FinancialCharts } from '@/components/owner/financial-charts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
    id: string
    created_at: string
    amount: number
    type: string
    description: string
    status: string
    properties: {
        title: string
    }
}

export default function FinancialsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // specific logic for Owner: get transactions for properties I own
            // 1. Get my properties
            const { data: properties } = await supabase
                .from('properties')
                .select('id')
                .eq('owner_id', user.id)

            if (properties && properties.length > 0) {
                const propertyIds = properties.map(p => p.id)

                // 2. Get financials for these properties
                const { data: financials } = await supabase
                    .from('financials')
                    .select('*, properties(title)')
                    .in('property_id', propertyIds)
                    .order('created_at', { ascending: false })
                    .limit(50) // limit to recent

                if (financials) {
                    setTransactions(financials as any)
                }
            }
            setLoading(false)
        }
        fetchTransactions()
    }, [supabase])

    return (
        <div className="container mx-auto p-4 space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Financial Reports</h1>
            </div>

            <FinancialCharts />

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                            No recent transactions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{format(new Date(tx.created_at), 'MMM d, yyyy')}</TableCell>
                                            <TableCell>{tx.properties?.title || 'Unknown'}</TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell className={tx.type === 'payment' ? 'text-green-600 font-medium' : ''}>
                                                {tx.type === 'payment' ? '+' : ''}${tx.amount}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tx.status === 'paid' ? 'default' : 'secondary'}>
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
