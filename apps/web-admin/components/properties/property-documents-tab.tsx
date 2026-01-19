'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface PropertyDocumentsTabProps {
    propertyId: string
}

interface Document {
    id: string
    name: string
    file_path: string
    created_at: string
}

export function PropertyDocumentsTab({ propertyId }: PropertyDocumentsTabProps) {
    const [documents, setDocuments] = useState<Document[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchDocuments = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setDocuments(data)
        }
        setLoading(false)
    }, [supabase, propertyId])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            const fileExt = file.name.split('.').pop()
            const fileName = `${propertyId}/${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('properties-documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('properties-documents')
                .getPublicUrl(filePath)

            // 3. Save to Documents Table
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    property_id: propertyId,
                    name: file.name,
                    file_path: publicUrl,
                    uploaded_by: (await supabase.auth.getUser()).data.user?.id
                })

            if (dbError) throw dbError

            toast.success('Document uploaded successfully')
            fetchDocuments()
        } catch (error: any) {
            toast.error('Upload failed: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Documents</h3>
                <div className="relative">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild disabled={uploading}>
                            <span>
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Upload Document
                            </span>
                        </Button>
                    </Label>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {loading && <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>}
                        {!loading && documents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                    No documents found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
