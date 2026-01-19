'use client'

import { useState, useEffect, useCallback } from 'react'
import { DocumentTable } from '@/components/documents/document-table'
import { BulkUploadDialog } from '@/components/documents/bulk-upload-dialog'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function DocumentsPage() {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const supabase = createClient()

    const fetchDocuments = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            if (resp.ok) {
                const data = await resp.json()
                setDocuments(data)
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    const filteredDocuments = documents.filter((doc: { name: string; properties?: { title: string }; profiles?: { full_name: string }; category: string }) => {
        const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
            doc.properties?.title?.toLowerCase().includes(search.toLowerCase()) ||
            doc.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground">
                        Manage property documents, identity verification, and tenant shares.
                    </p>
                </div>
                <BulkUploadDialog onSuccess={fetchDocuments} />
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search document name, property, or tenant..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="lease">Lease Agreement</SelectItem>
                        <SelectItem value="id">Identity Document</SelectItem>
                        <SelectItem value="photo">Photos</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <DocumentTable
                    documents={filteredDocuments}
                    onRefresh={fetchDocuments}
                />
            )}
        </div>
    )
}
