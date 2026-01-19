'use client'

import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PropertyDocumentsTab } from './property-documents-tab'
import { Building, FileText, History, Image as ImageIcon } from 'lucide-react'
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

interface PropertyDetailsSheetProps {
    propertyId: string
    isOpen: boolean
    onClose: () => void
    initialData?: any
}

export function PropertyDetailsSheet({ propertyId, isOpen, onClose, initialData }: PropertyDetailsSheetProps) {
    const [activeTab, setActiveTab] = useState('overview')
    const supabase = createClient()
    const router = useRouter()
    const [status, setStatus] = useState(initialData?.status)

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus)
        const { error } = await supabase
            .from('properties')
            .update({ status: newStatus })
            .eq('id', propertyId)

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
                            <SheetTitle className="text-2xl">{initialData.title}</SheetTitle>
                            <SheetDescription className="text-base mt-1">
                                {initialData.address}
                            </SheetDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={status || initialData.status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SheetHeader>

                <div className="w-full">
                    <div className="flex border-b mb-6 gap-6 px-1">
                        {['overview', 'documents', 'media', 'history'].map((tab) => (
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
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-lg flex items-center gap-2">
                                    <Building className="h-5 w-5 text-primary" />
                                    Property Details
                                </h3>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 bg-muted/20 p-5 rounded-xl border">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</p>
                                        <p className="font-medium">{initialData.metadata?.type || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Area</p>
                                        <p className="font-medium">{initialData.metadata?.area ? `${initialData.metadata.area} m²` : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rooms</p>
                                        <p className="font-medium">{initialData.metadata?.rooms || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</p>
                                        <p className="font-medium">{initialData.metadata?.price ? `$${initialData.metadata.price}` : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tenant / Contract Info */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Current Contract
                                </h3>
                                {initialData.contracts?.find((c: any) => c.status === 'active') ? (
                                    <div className="bg-muted/20 p-5 rounded-xl border">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Tenant</p>
                                                <p className="font-medium text-lg">
                                                    {initialData.contracts.find((c: any) => c.status === 'active')?.profiles?.full_name || 'Unknown Tenant'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Monthly Rent</p>
                                                <p className="font-medium text-lg text-primary">
                                                    ${initialData.contracts.find((c: any) => c.status === 'active')?.monthly_rent}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-muted/20 p-8 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground">
                                        <p>No active contract found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <PropertyDocumentsTab propertyId={propertyId} />
                    )}

                    {activeTab === 'media' && (
                        <div className="py-8 text-center text-muted-foreground">
                            <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>Media Gallery coming soon...</p>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="py-8 text-center text-muted-foreground">
                            <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>History log coming soon...</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
