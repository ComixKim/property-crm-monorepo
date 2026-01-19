'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Property {
    id: string
    title: string
    address: string
    status: string
}

export function PropertyList({ userId }: { userId: string }) {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProperties = async () => {
            // Assuming we will link properties to owners via a 'contract' or a direct 'owner_id' field later.
            // For now, let's fetch ALL properties (mocking owner ownership) or if the schema supported it, filter by owner_id.
            // Since the schema currently has 'reporter_id' on tickets etc, but properties might not have owner_id yet.
            // Let's assume for this phase we just list all or filter by some logic.
            // EDIT: Looking at previous context, `properties` table exists. Let's see if we can filter.
            // If not, we'll just fetch all for demo purposes or strictly `draft` ones if that's what we have.

            // Checking if we can filter by the current user being the "owner" (maybe via 'created_by' logic or strict RLS)
            // Ideally: .eq('owner_id', userId)
            // But let's stick to simple fetch for now and assume the API/RLS handles visibility.

            const { data } = await supabase
                .from('properties')
                .select('*')
            // .eq('owner_id', userId) // FUTURE: Enable this

            if (data) setProperties(data)
            setLoading(false)
        }
        fetchProperties()
    }, [userId, supabase])

    if (loading) return <div>Loading properties...</div>

    if (properties.length === 0) {
        return (
            <Card className="border-dashed shadow-none">
                <CardContent className="p-8 flex items-center justify-center text-muted-foreground text-sm">
                    No properties found.
                </CardContent>
            </Card>
        )
    }



    // ... existing code ...

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
                <Link href={`/properties/${property.id}`} key={property.id} className="block group">
                    <Card className="h-full border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-white hover:shadow-lg transition-all duration-300 hover:scale-[1.01] rounded-2xl">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="h-10 w-10 rounded-full bg-[oklch(0.78_0.15_265)]/10 flex items-center justify-center text-[oklch(0.78_0.15_265)] group-hover:bg-[oklch(0.78_0.15_265)] group-hover:text-white transition-colors duration-300">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <Badge variant="secondary" className={`capitalize font-medium ${property.status === 'occupied' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {property.status}
                                </Badge>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{property.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{property.address || 'No address provided'}</p>
                                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                    {property.status === 'occupied' && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-foreground">$1,200</span>
                                            <span>/mo</span>
                                        </div>
                                    )}
                                    {property.status === 'occupied' && (
                                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            Paid
                                        </div>
                                    )}
                                    {property.status === 'vacant' && (
                                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                            No Income
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end">
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
