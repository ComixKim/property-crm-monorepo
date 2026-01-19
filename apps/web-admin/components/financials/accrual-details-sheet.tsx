'use client'

import { useState, useCallback, useEffect } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, ExternalLink, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AccrualDetailsSheetProps {
    accrualId: string | null
    isOpen: boolean
    onClose: () => void
    initialData: any
    onUpdate: () => void
}

export function AccrualDetailsSheet({ accrualId, isOpen, onClose, initialData, onUpdate }: AccrualDetailsSheetProps) {
    const supabase = createClient()
    const [uploading, setUploading] = useState(false)
    const [loadingPayments, setLoadingPayments] = useState(false)
    const [payments, setPayments] = useState<any[]>([])

    // Load linked payments
    const fetchPayments = useCallback(async () => {
        if (!accrualId) return
        setLoadingPayments(true)
        const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('accrual_id', accrualId)
            .order('created_at', { ascending: false })

        if (data) setPayments(data)
        setLoadingPayments(false)
    }, [accrualId, supabase])

    useEffect(() => {
        if (isOpen && accrualId) {
            fetchPayments()
        }
    }, [isOpen, accrualId, fetchPayments])

    const handleMarkAsPaid = async () => {
        // Create a full payment record manually
        const { error } = await supabase.from('payments').insert({
            accrual_id: accrualId,
            amount: initialData.amount,
            status: 'completed',
            provider_txn_id: `MANUAL-${Date.now()}`
        })

        if (error) {
            toast.error('Failed to mark as paid')
        } else {
            // Also update accrual status
            await supabase.from('accruals').update({ status: 'paid' }).eq('id', accrualId)
            toast.success('Marked as Paid')
            fetchPayments()
            onUpdate()
        }
    }

    const handleUploadReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            const fileExt = file.name.split('.').pop()
            const fileName = `receipts/${accrualId}/${Math.random()}.${fileExt}`
            const filePath = fileName

            // 1. Upload
            const { error: uploadError } = await supabase.storage
                .from('properties-documents') // Using shared bucket for now 
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('properties-documents')
                .getPublicUrl(filePath)

            // 3. Create or Update Payment Record
            // If already completed payment exists, attach receipt to latest. If not, create pending/completed payment with receipt.
            // Simplified: Just update the most recent payment or create a new 'completed' one if none.

            let paymentId = payments[0]?.id

            if (!paymentId) {
                // Create new payment record for this receipt
                const { data: payData, error: payError } = await supabase.from('payments').insert({
                    accrual_id: accrualId,
                    amount: initialData.amount,
                    status: 'completed',
                    provider_txn_id: `RECEIPT-${Date.now()}`,
                    receipt_url: publicUrl
                }).select().single()

                if (payError) throw payError
                // Update accrual
                await supabase.from('accruals').update({ status: 'paid' }).eq('id', accrualId)

            } else {
                // Update existing
                const { error: updateError } = await supabase
                    .from('payments')
                    .update({ receipt_url: publicUrl })
                    .eq('id', paymentId)
                if (updateError) throw updateError
            }

            toast.success('Receipt uploaded')
            fetchPayments()
            onUpdate()

        } catch (error: any) {
            toast.error('Upload failed: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    if (!initialData) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mt-8 mb-8 pr-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="uppercase px-3 py-1 text-xs font-semibold tracking-wider bg-secondary/50">{(initialData.type || initialData.category || 'Expense').replace('_', ' ')}</Badge>
                            <Badge className={cn(
                                "capitalize px-3 py-1",
                                initialData.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                    initialData.status === 'overdue' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                        'bg-secondary text-secondary-foreground hover:bg-secondary'
                            )}>
                                {initialData.status}
                            </Badge>
                        </div>
                        <div>
                            <SheetTitle className="text-4xl font-bold tracking-tight text-foreground/90">${parseFloat(initialData.amount).toFixed(2)}</SheetTitle>
                            <SheetDescription className="text-lg font-medium text-muted-foreground mt-1">{initialData.properties?.title}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-8">
                    {/* INFO */}
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-muted-foreground">Due Date</p>
                                <p className="font-medium">{initialData.due_date}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Description</p>
                                <p className="font-medium">{initialData.description || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* PAYMENTS */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-lg">Payments</h3>

                        {payments.length > 0 ? (
                            <div className="space-y-3">
                                {payments.map((pay: any) => (
                                    <div key={pay.id} className="group bg-card hover:bg-accent/5 transition-colors p-4 rounded-xl border shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-sm flex items-center gap-2 text-foreground">
                                                <CheckCircle className="h-4 w-4 text-green-500 fill-green-500/10" />
                                                Paid on {format(new Date(pay.created_at), 'PPP')}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 font-mono bg-secondary/50 px-1.5 py-0.5 rounded w-fit max-w-[200px] truncate" title={pay.provider_txn_id}>
                                                {pay.provider_txn_id}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            {pay.receipt_url && (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild title="View Receipt">
                                                    <a href={pay.receipt_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed">
                                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                            </div>
                        )}

                        {/* ACTIONS */}
                        {initialData.status !== 'paid' && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button onClick={handleMarkAsPaid} variant="default">
                                    Mark as Paid
                                </Button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="receipt-upload"
                                        className="hidden"
                                        onChange={handleUploadReceipt}
                                        disabled={uploading}
                                    />
                                    <Label htmlFor="receipt-upload" className="cursor-pointer w-full block">
                                        <Button variant="outline" className="w-full" asChild disabled={uploading}>
                                            <span>
                                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                                Upload Receipt
                                            </span>
                                        </Button>
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
