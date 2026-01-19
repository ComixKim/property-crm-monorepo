import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Download, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DocumentEntry {
    id: string
    name: string
    file_path: string
    category: string
    created_at: string
}

export function DocumentsVault() {
    const [docs, setDocs] = useState<DocumentEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [categoryFilter, setCategoryFilter] = useState('all')
    const supabase = createClient()

    const fetchDocs = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/my`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            if (resp.ok) {
                const data = await resp.json()
                setDocs(data)
            } else {
                toast.error('Failed to load documents')
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to load documents')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchDocs()
    }, [fetchDocs])

    const handleDownload = async (filename: string, displayPath: string) => {
        try {
            const { data, error } = await supabase
                .storage
                .from('documents')
                .download(displayPath)

            if (error) throw error

            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error(error)
            toast.error('Download failed')
        }
    }

    const filteredDocs = docs.filter(doc =>
        categoryFilter === 'all' || doc.category === categoryFilter
    )

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'lease': return 'bg-blue-100 text-blue-800'
            case 'id': return 'bg-purple-100 text-purple-800'
            case 'photo': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Documents</SelectItem>
                        <SelectItem value="lease">Lease Agreements</SelectItem>
                        <SelectItem value="id">ID Documents</SelectItem>
                        <SelectItem value="photo">Photos</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filteredDocs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No documents found matching the filter.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDocs.map((doc) => (
                        <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className={getCategoryColor(doc.category)}>
                                        {doc.category.toUpperCase()}
                                    </Badge>
                                    <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.name, doc.file_path)}>
                                        <Download className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="truncate">
                                        <div className="font-medium text-sm truncate" title={doc.name}>{doc.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
