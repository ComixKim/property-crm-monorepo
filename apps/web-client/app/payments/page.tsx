'use client'

import { useCallback, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Invoice {
    id: string
    amount: number
    status: 'pending' | 'paid' | 'overdue'
    due_date: string
    paid_at?: string
    contracts: {
        properties: {
            title: string
            address: string
        }
    }
}

export default function PaymentsPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const supabase = createClient()

    const fetchInvoices = useCallback(async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to load invoices')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    const handlePay = async (id: string) => {
        setActionLoading(id)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/pay`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            })

            if (!res.ok) throw new Error('Payment failed')

            toast.success('Payment successful!')
            fetchInvoices()
        } catch (error) {
            console.error(error)
            toast.error('Payment failed. Please try again.')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>

    const pending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue')
    const history = invoices.filter(i => i.status === 'paid')

    return (
        <div className="p-4 space-y-6 pb-20">
            <h1 className="text-2xl font-bold">Payments</h1>

            {/* Balance Card */}
            <Card className="!bg-black !text-white border-none shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">Total Due</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">
                        ${pending.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                    </div>
                </CardContent>
            </Card>

            {/* Pending Invoices */}
            <div className="space-y-3">
                <h2 className="font-semibold text-lg">Due Now</h2>
                {pending.length === 0 && <p className="text-muted-foreground text-sm">No pending invoices.</p>}
                {pending.map(invoice => (
                    <Card key={invoice.id}>
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-lg">${invoice.amount}</div>
                                    <div className="text-sm text-muted-foreground">Rent • {format(new Date(invoice.due_date), 'MMMM yyyy')}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{invoice.contracts.properties.title}</div>
                                </div>
                                <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                                    {invoice.status}
                                </Badge>
                            </div>
                            <Button
                                className="w-full"
                                onClick={() => handlePay(invoice.id)}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === invoice.id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                Pay Now
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* History */}
            <div className="space-y-3 pt-4">
                <h2 className="font-semibold text-lg">History</h2>
                {history.length === 0 && <p className="text-muted-foreground text-sm">No payment history.</p>}
                {history.map(invoice => (
                    <Card key={invoice.id} className="opacity-80">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <div className="font-medium">${invoice.amount}</div>
                                <div className="text-xs text-muted-foreground">Paid on {invoice.paid_at ? format(new Date(invoice.paid_at), 'PPP') : '-'}</div>
                            </div>
                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
