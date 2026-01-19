'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueData {
    name: string
    revenue: number
    [key: string]: string | number
}

interface ExpenseData {
    name: string
    value: number
    [key: string]: string | number
}

const COLORS = ['oklch(0.78 0.15 265)', 'oklch(0.88 0.12 85)', 'oklch(0.85 0.1 150)', 'oklch(0.75 0.15 30)', 'oklch(0.6 0.15 250)'];

export function FinancialCharts() {
    const [revenueData, setRevenueData] = useState<RevenueData[]>([])
    const [expenseData, setExpenseData] = useState<ExpenseData[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            try {
                const [revRes, expRes] = await Promise.all([
                    fetch('http://localhost:4000/financials/revenue-chart', {
                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                    }),
                    fetch('http://localhost:4000/financials/expenses-chart', {
                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                    })
                ])

                if (revRes.ok) setRevenueData(await revRes.json())
                if (expRes.ok) setExpenseData(await expRes.json())

            } catch (error) {
                console.error("Failed to load chart data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [supabase.auth])

    if (loading) return <div className="text-center py-10">Loading charts...</div>

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Monthly Revenue (Last 12 Months)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={revenueData}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px' }}
                            />
                            <Bar dataKey="revenue" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={expenseData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {expenseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
