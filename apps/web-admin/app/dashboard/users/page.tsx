'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

import { UserDialog } from '@/components/users/user-dialog'

interface Profile {
    id: string
    full_name: string
    email: string
    role: string
    created_at: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [accessToken, setAccessToken] = useState<string>('')
    const supabase = createClient()

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) setAccessToken(session.access_token)
        }
        getSession()

        const fetchUsers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setUsers(data)
            setLoading(false)
        }

        fetchUsers()
    }, [supabase])

    const refreshUsers = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setUsers(data)
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                <UserDialog onSuccess={refreshUsers} accessToken={accessToken} />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>{user.created_at ? format(new Date(user.created_at), 'PPP') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                        {!loading && users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
