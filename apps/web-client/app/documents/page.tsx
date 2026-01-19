'use client'

import { DocumentsVault } from '@/components/owner/documents-vault'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DocumentsPage() {
    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Document Vault</h1>
            </div>

            <DocumentsVault />
        </div>
    )
}
