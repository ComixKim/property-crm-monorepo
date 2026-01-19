'use client'

import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { ContractDocumentsTab } from './contract-documents-tab'
import { FileText, Calendar as CalendarIcon, DollarSign, User } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface ContractDetailsSheetProps {
    contractId: string
    isOpen: boolean
    onClose: () => void
    initialData?: any
}

export function ContractDetailsSheet({ contractId, isOpen, onClose, initialData }: ContractDetailsSheetProps) {
    const [activeTab, setActiveTab] = useState('overview')
    const supabase = createClient()
    const router = useRouter()
    const [status, setStatus] = useState(initialData?.status)

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus)
        const { error } = await supabase
            .from('contracts')
            .update({ status: newStatus })
            .eq('id', contractId)

        if (error) {
            toast.error('Failed to update status')
            setStatus(initialData?.status)
        } else {
            toast.success('Status updated')
            router.refresh()
        }
    }

    if (!initialData) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] md:w-[705px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="pr-10">
                            <SheetTitle className="text-2xl">Contract Details</SheetTitle>
                            <SheetDescription className="text-base mt-1">
                                {initialData.properties?.title}
                            </SheetDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={status || initialData.status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="ending">Ending</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                    <SelectItem value="terminated">Terminated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SheetHeader>

                <div className="w-full">
                    <div className="flex border-b mb-6 gap-6 px-1">
                        {['overview', 'payments', 'documents'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Parties */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Parties
                                </h3>
                                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-5 rounded-xl border">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tenant</p>
                                        <p className="font-medium text-lg">{initialData.profiles?.full_name || initialData.profiles?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Property</p>
                                        <p className="font-medium">{initialData.properties?.title}</p>
                                    </div>
                                    <div className="col-span-2 pt-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent</p>
                                        <p className="font-medium text-sm text-muted-foreground">No agent assigned</p>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Terms & Financials
                                </h3>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 bg-muted/20 p-5 rounded-xl border">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Rent</p>
                                        <p className="font-medium text-xl text-primary">${initialData.monthly_rent}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deposit</p>
                                        <p className="font-medium text-xl">${initialData.deposit_amount || '0'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</p>
                                        <p className="font-medium">{initialData.start_date ? format(new Date(initialData.start_date), 'PPP') : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">End Date</p>
                                        <p className="font-medium">{initialData.end_date ? format(new Date(initialData.end_date), 'PPP') : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                <h3 className="font-medium text-lg">Payment Calendar</h3>
                            </div>

                            <div className="bg-muted/20 p-8 rounded-xl border border-dashed text-center text-muted-foreground">
                                <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>Payment usage history coming soon...</p>
                                <p className="text-xs mt-2">Will reference Accruals table.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <ContractDocumentsTab contractId={contractId} />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
