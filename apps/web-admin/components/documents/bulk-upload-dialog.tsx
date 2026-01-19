'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Upload, X, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface BulkUploadDialogProps {
    onSuccess: () => void
}

export function BulkUploadDialog({ onSuccess }: BulkUploadDialogProps) {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [category, setCategory] = useState('other')
    const [propertyId, setPropertyId] = useState<string>('')
    const [tenantId, setTenantId] = useState<string>('')
    const [isShared, setIsShared] = useState(false)
    const [loading, setLoading] = useState(false)
    const [properties, setProperties] = useState<{ id: string; title: string }[]>([])
    const [tenants, setTenants] = useState<{ id: string; full_name: string; email: string }[]>([])

    const supabase = createClient()

    const fetchOptions = useCallback(async () => {
        const [propRes, tenantRes] = await Promise.all([
            supabase.from('properties').select('id, title'),
            supabase.from('profiles').select('id, full_name, email').eq('role', 'tenant')
        ])
        setProperties(propRes.data || [])
        setTenants(tenantRes.data || [])
    }, [supabase])

    useEffect(() => {
        if (open) {
            fetchOptions()
        }
    }, [open, fetchOptions])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) return
        setLoading(true)

        try {
            const session = (await supabase.auth.getSession()).data.session
            if (!session) throw new Error('Not authenticated')

            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
                const filePath = `vault/${fileName}`

                // 1. Upload to Storage
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                // 2. Save Metadata via API
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        name: file.name,
                        file_path: filePath,
                        category,
                        property_id: propertyId || undefined,
                        tenant_id: tenantId || undefined,
                        is_shared: isShared
                    })
                })

                if (!resp.ok) {
                    const errorMsg = await resp.text()
                    console.error('Upload failed:', resp.status, errorMsg)
                    throw new Error(`Failed to save metadata for ${file.name}: ${errorMsg}`)
                }
            }

            toast.success(`Successfully uploaded ${files.length} documents`)
            setOpen(false)
            setFiles([])
            onSuccess()
        } catch (error: unknown) {
            console.error(error)
            const message = error instanceof Error ? error.message : 'Upload failed'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Bulk Upload
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bulk Upload Documents</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label>Select Files</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors relative cursor-pointer">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Click or drag and drop files here</p>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className="h-4 w-4 flex-shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lease">Lease Agreement</SelectItem>
                                    <SelectItem value="id">Identity Document</SelectItem>
                                    <SelectItem value="photo">Photos</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Property (Optional)</Label>
                            <Select value={propertyId} onValueChange={setPropertyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select property" />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Assign to Tenant (Optional)</Label>
                        <Select value={tenantId} onValueChange={setTenantId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select tenant" />
                            </SelectTrigger>
                            <SelectContent>
                                {tenants.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.full_name} ({t.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="shared"
                            checked={isShared}
                            onCheckedChange={(checked: boolean) => setIsShared(!!checked)}
                            disabled={!tenantId}
                        />
                        <Label htmlFor="shared" className={!tenantId ? "text-muted-foreground" : ""}>
                            Share immediately with selected tenant
                        </Label>
                    </div>

                    <Button className="w-full" onClick={handleUpload} disabled={loading || files.length === 0}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Upload {files.length > 0 ? `${files.length} Files` : ''}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
