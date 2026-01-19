'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ArrowRight, ArrowLeft, Home, Calendar as CalendarIcon, FileCheck } from 'lucide-react'
import { MoveProcessWizard } from '@/components/moves/move-process-wizard'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface MoveInspect {
    id: string
    type: 'move_in' | 'move_out' | 'routine'
    date: string
    status: string
    properties: { title: string }
    contracts?: {
        profiles: { full_name: string }
    }
}

export default function MovesPage() {
    const [moves, setMoves] = useState<MoveInspect[]>([])
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [wizardOpen, setWizardOpen] = useState(false)
    const supabase = createClient()

    const fetchMoves = async () => {
        const { data } = await supabase
            .from('inspections')
            .select('*, properties(title), contracts(profiles(full_name))')
            .in('type', ['move_in', 'move_out'])
            .order('date', { ascending: false })

        if (data) setMoves(data as any)
    }

    useEffect(() => {
        fetchMoves()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Move-In / Move-Out</h2>
                    <p className="text-muted-foreground">Manage tenant onboarding and offboarding processes.</p>
                </div>
                <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Start Process
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Upcoming Moves</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {moves.length === 0 && <div className="text-center text-muted-foreground py-10">No moves scheduled.</div>}
                            {moves.map(move => (
                                <div key={move.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={cn("p-2 rounded-full", move.type === 'move_in' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                                            {move.type === 'move_in' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{move.properties.title}</h4>
                                            <p className="text-sm text-muted-foreground">{move.contracts?.profiles?.full_name}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="outline">{format(new Date(move.date), 'PPP')}</Badge>
                                                <Badge className="capitalize">{move.status}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">View Details &rarr;</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                        />
                        <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium">Scheduled for {date ? format(date, 'PP') : 'Selected Date'}</h4>
                            {moves.filter(m => date && new Date(m.date).toDateString() === date.toDateString()).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No moves on this date.</p>
                            ) : (
                                moves.filter(m => date && new Date(m.date).toDateString() === date.toDateString()).map(m => (
                                    <div key={m.id} className="text-sm p-2 bg-muted rounded flex justify-between">
                                        <span>{m.type === 'move_in' ? 'Move In' : 'Move Out'}</span>
                                        <span className="font-medium">{m.properties.title}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <MoveProcessWizard open={wizardOpen} onOpenChange={setWizardOpen} onSuccess={fetchMoves} />
        </div>
    )
}
