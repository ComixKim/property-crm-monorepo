'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, MapPin, Home, Info, User, Mail, Phone, Ruler, Building, Bed, DollarSign } from 'lucide-react'
import { TicketDialog } from '@/components/tickets/ticket-dialog'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Property {
    id: string
    owner_id: string
    title: string
    address: string
    status: string
    image_url?: string
    metadata?: {
        image?: string
        area?: number
        type?: string
        rooms?: number
        price?: number
        [key: string]: unknown
    }
    created_at: string
}

interface Profile {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    avatar_url?: string
}

export default function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [property, setProperty] = useState<Property | null>(null)
    const [owner, setOwner] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProperty = async () => {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setProperty(data)

                // Fetch owner details
                if (data.owner_id) {
                    const { data: ownerData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', data.owner_id)
                        .single()
                    if (ownerData) setOwner(ownerData)
                }
            } else {
                console.error('Error fetching property:', error)
            }
            setLoading(false)
        }

        if (id) fetchProperty()
    }, [id, supabase])

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading property details...</div>
    }

    if (!property) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">Property not found.</p>
                <Button variant="link" onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    const { area, type, rooms, price } = property.metadata || {}

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
            {/* Header */}
            <header className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold font-sans">Property Details</h1>
            </header>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Left Column: Image & Status */}
                <div className="space-y-6">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                        {(property.image_url || property.metadata?.image) ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={property.image_url || property.metadata?.image || ''}
                                    alt={property.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-gray-100 dark:bg-gray-800">
                                <Home className="h-12 w-12 opacity-20" />
                            </div>
                        )}
                        <div className="absolute top-4 right-4">
                            <Badge variant={property.status === 'active' ? 'default' : 'secondary'} className="uppercase">
                                {property.status || 'Draft'}
                            </Badge>
                        </div>
                    </div>

                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                <Ruler className="h-5 w-5 text-muted-foreground mb-1" />
                                <div className="text-sm font-medium">Area</div>
                                <div className="text-xs text-muted-foreground">{area ? `${area} sqft` : 'N/A'}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                <Building className="h-5 w-5 text-muted-foreground mb-1" />
                                <div className="text-sm font-medium">Type</div>
                                <div className="text-xs text-muted-foreground capitalize">{type || 'N/A'}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                <Bed className="h-5 w-5 text-muted-foreground mb-1" />
                                <div className="text-sm font-medium">Rooms</div>
                                <div className="text-xs text-muted-foreground">{rooms || 'N/A'}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                <DollarSign className="h-5 w-5 text-muted-foreground mb-1" />
                                <div className="text-sm font-medium">Price</div>
                                <div className="text-xs text-muted-foreground">{price ? `$${price}/mo` : 'N/A'}</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{property.title}</h2>
                        <div className="flex items-center text-muted-foreground mt-2 text-lg">
                            <MapPin className="h-5 w-5 mr-2" />
                            {property.address}
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Info className="h-5 w-5 mr-2" />
                                Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Property ID</p>
                                    <p className="font-mono text-xs truncate" title={property.id}>{property.id}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Added On</p>
                                    <p>{new Date(property.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {property.metadata && Object.keys(property.metadata).length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm font-medium mb-2">Additional Metadata</p>
                                    <div className="text-xs text-muted-foreground">
                                        {Object.entries(property.metadata)
                                            .filter(([key]) => !['image', 'area', 'type', 'rooms', 'price'].includes(key))
                                            .map(([key, value]) => (
                                                <div key={key} className="flex justify-between py-1 border-b last:border-0 border-dashed">
                                                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                                    <span className="font-mono">{String(value)}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button className="flex-1" variant="outline">
                                    <User className="mr-2 h-4 w-4" />
                                    Contact Manager
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-4">
                                    <h4 className="font-medium leading-none">Property Manager</h4>
                                    {owner ? (
                                        <div className="flex items-start space-x-4">
                                            <Avatar>
                                                <AvatarImage src={owner.avatar_url} />
                                                <AvatarFallback>{owner.first_name?.[0]}{owner.last_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">{owner.first_name} {owner.last_name}</p>
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Mail className="mr-2 h-3 w-3" />
                                                    {owner.email}
                                                </div>
                                                {owner.phone && (
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <Phone className="mr-2 h-3 w-3" />
                                                        {owner.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No manager information available.</p>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <TicketDialog
                            propertyId={property.id}
                            trigger={
                                <Button className="flex-1">
                                    Report Issue
                                </Button>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
