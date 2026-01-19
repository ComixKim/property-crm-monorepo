'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, ChevronLeft, ChevronRight, Check, Image as ImageIcon } from 'lucide-react'

interface PropertyWizardProps {
    onSuccess: () => void
}

interface OwnerProfile {
    id: string
    full_name: string
    email: string
    role: string
}

export function PropertyWizard({ onSuccess }: PropertyWizardProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [owners, setOwners] = useState<OwnerProfile[]>([])
    const supabase = createClient()

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        address: '',
        type: 'apartment',
        area: '',
        rooms: '',
        price: '',
        owner_id: '',
    })
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const fetchOwners = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch('http://localhost:4000/users', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })
            if (res.ok) {
                const data = await res.json()
                const ownersOnly = data.filter((u: OwnerProfile) => u.role === 'owner')
                setOwners(ownersOnly)
                if (ownersOnly.length === 0) {
                    toast.info('No owners found in the system')
                }
            } else {
                console.error('Fetch failed with status:', res.status)
                toast.error(`Failed to fetch users: ${res.status} ${res.statusText}`)
            }
        } catch (error) {
            console.error('Failed to fetch owners', error)
            toast.error('Network error fetching owners')
        }
    }, [supabase])

    useEffect(() => {
        if (open && step === 3 && owners.length === 0) {
            fetchOwners()
        }
    }, [open, step, owners.length, fetchOwners])

    const handleNext = () => {
        if (step === 1 && (!formData.title || !formData.address)) {
            toast.error('Please fill basic info')
            return
        }
        setStep(step + 1)
    }

    const handleBack = () => setStep(step - 1)

    const handleCreate = async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            toast.error('Session expired')
            setLoading(false)
            return
        }

        try {
            let imageUrl = null
            if (file) {
                setUploading(true)
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('properties')
                    .upload(filePath, file)

                if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

                const { data: { publicUrl } } = supabase.storage
                    .from('properties')
                    .getPublicUrl(filePath)
                imageUrl = publicUrl
                setUploading(false)
            }

            const res = await fetch('http://localhost:4000/properties', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    address: formData.address,
                    owner_id: formData.owner_id || null,
                    status: 'draft',
                    metadata: {
                        type: formData.type,
                        area: formData.area ? parseInt(formData.area) : null,
                        rooms: formData.rooms ? parseInt(formData.rooms) : null,
                        price: formData.price ? parseFloat(formData.price) : null,
                        image: imageUrl
                    }
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to create property')
            }

            toast.success('Property onboarded successfully')
            setOpen(false)
            resetForm()
            onSuccess()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Something went wrong';
            toast.error(message)
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    const resetForm = () => {
        setStep(1)
        setFormData({
            title: '',
            address: '',
            type: 'apartment',
            area: '',
            rooms: '',
            price: '',
            owner_id: '',
        })
        setFile(null)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (!v) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Property</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        Step {step} of 4: {
                            step === 1 ? 'Basic Info' :
                                step === 2 ? 'Technical Details' :
                                    step === 3 ? 'Ownership' : 'Media'
                        }
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Property Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Sunset Apartments #301"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="e.g. 123 Main St, London"
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Property Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={v => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="apartment">Apartment</SelectItem>
                                        <SelectItem value="house">House</SelectItem>
                                        <SelectItem value="studio">Studio</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="area">Area (sqft)</Label>
                                    <Input
                                        id="area"
                                        type="number"
                                        value={formData.area}
                                        onChange={e => setFormData({ ...formData, area: e.target.value })}
                                        placeholder="850"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="rooms">Rooms</Label>
                                    <Input
                                        id="rooms"
                                        type="number"
                                        value={formData.rooms}
                                        onChange={e => setFormData({ ...formData, rooms: e.target.value })}
                                        placeholder="2"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">Monthly Rent (£)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="1500"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="owner">Assign Owner</Label>
                                <Select
                                    value={formData.owner_id}
                                    onValueChange={v => setFormData({ ...formData, owner_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Search or select owner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {owners.length === 0 ? (
                                            <div className="p-2 text-sm text-center text-muted-foreground">Loading owners...</div>
                                        ) : (
                                            owners.map(o => (
                                                <SelectItem key={o.id} value={o.id}>
                                                    {o.full_name || o.email}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Owners assigned here will be able to see this property and its financials in their dashboard.
                            </p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4 text-center">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-muted/50">
                                {file ? (
                                    <div className="space-y-2">
                                        <Check className="h-10 w-10 text-green-500 mx-auto" />
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                                        <Label htmlFor="image-upload" className="cursor-pointer">
                                            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                                                Select Primary Image
                                            </div>
                                            <Input
                                                id="image-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={e => setFile(e.target.files?.[0] || null)}
                                            />
                                        </Label>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center">
                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button variant="outline" onClick={handleBack} disabled={loading}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step < 4 ? (
                            <Button onClick={handleNext}>
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleCreate} disabled={loading || uploading}>
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Onboarding...</>
                                ) : (
                                    'Complete Onboarding'
                                )}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
