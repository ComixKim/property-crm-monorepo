'use client'

import { useState } from 'react'
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
import { Download, Trash2, Share2, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Document {
    id: string
    name: string
    file_path: string
    category: string
    is_shared: boolean
    created_at: string
    properties?: { title: string }
    profiles?: { full_name: string; email: string }
}

interface DocumentTableProps {
    documents: Document[]
    onRefresh: () => void
}

export function DocumentTable({ documents, onRefresh }: DocumentTableProps) {
    const supabase = createClient()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleDownload = async (doc: Document) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .download(doc.file_path)

            if (error) throw error

            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = doc.name
            document.body.appendChild(a)
            a.click()
            URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error(err)
            toast.error('Download failed')
        }
    }

    const toggleShare = async (doc: Document) => {
        setLoadingId(doc.id)
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({ is_shared: !doc.is_shared })
            })

            if (!resp.ok) throw new Error('Failed to update sharing')

            toast.success(doc.is_shared ? 'Document unshared' : 'Document shared with tenant')
            onRefresh()
        } catch (err) {
            console.error(err)
            toast.error('Failed to update sharing')
        } finally {
            setLoadingId(null)
        }
    }

    const handleDelete = async (doc: Document) => {
        if (!confirm('Are you sure you want to delete this document?')) return

        try {
            // 1. Delete from storage
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([doc.file_path])

            if (storageError) throw storageError

            // 2. Delete from DB via API
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            })

            if (!resp.ok) throw new Error('Failed to delete metadata')

            toast.success('Document deleted')
            onRefresh()
        } catch (err) {
            console.error(err)
            toast.error('Failed to delete document')
        }
    }

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'lease': return 'bg-blue-100 text-blue-800'
            case 'id': return 'bg-purple-100 text-purple-800'
            case 'photo': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {doc.name}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={getCategoryColor(doc.category)}>
                                    {doc.category.toUpperCase()}
                                </Badge>
                            </TableCell>
                            <TableCell>{doc.properties?.title || '-'}</TableCell>
                            <TableCell>{doc.profiles?.full_name || '-'}</TableCell>
                            <TableCell>
                                {doc.is_shared ? (
                                    <Badge className="bg-blue-500">SHARED</Badge>
                                ) : (
                                    <Badge variant="outline">PRIVATE</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {format(new Date(doc.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleShare(doc)}
                                        disabled={loadingId === doc.id || !doc.profiles}
                                        title={doc.profiles ? 'Toggle share with tenant' : 'No tenant assigned'}
                                    >
                                        <Share2 className={cn("h-4 w-4", doc.is_shared && "text-blue-500")} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
