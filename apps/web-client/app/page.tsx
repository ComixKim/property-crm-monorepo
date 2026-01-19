'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Home, CreditCard, Ticket as TicketIcon } from 'lucide-react'
import { format } from 'date-fns'
import { OwnerDashboard } from '@/components/owner/owner-dashboard'
import Link from 'next/link'
import { NotificationBell } from '@/components/notification-bell'
import { UserNav } from '@/components/user-nav'
import { TenantDashboard } from '@/components/tenant/tenant-dashboard'
import { ManagerDashboard } from '@/components/manager/manager-dashboard'
import { AgentDashboard } from '@/components/agent/agent-dashboard'
import { ServiceDashboard } from '@/components/service/service-dashboard'

interface Profile {
  full_name: string
  email: string
  role?: string
}

interface Contract {
  id: string
  monthly_rent: number
  properties: {
    id: string
    title: string
    address: string
  }
}

export default function HomePage() {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', user.id)
        .single()

      const role = profileData?.role || 'tenant'
      setUserRole(role)
      setProfile(profileData as Profile)

      if (role === 'owner') {
        setLoading(false)
        return
      }

      // 2. If Tenant, Fetch Contract
      // Fetch active contract for this tenant
      const { data } = await supabase
        .from('contracts')
        .select('*, properties(id, title, address)')
        .eq('tenant_id', user.id)
        .eq('status', 'active')
        .single()

      if (data) {
        setContract(data as unknown as Contract)
      }
      setLoading(false)
    }

    init()
  }, [router, supabase])

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  // OWNER VIEW
  if (userRole === 'owner' && userId) {
    return (
      <div className="p-4">
        <OwnerDashboard userId={userId} profile={profile} />
      </div>
    )
  }

  // MANAGER VIEW
  if ((userRole === 'manager' || userRole === 'admin_uk') && userId) {
    return (
      <ManagerDashboard userId={userId} profile={profile} />
    )
  }

  // AGENT VIEW
  if (userRole === 'agent' && userId) {
    return (
      <AgentDashboard userId={userId} profile={profile} />
    )
  }

  // SERVICE VIEW
  if (userRole === 'service' && userId) {
    return (
      <ServiceDashboard userId={userId} profile={profile} />
    )
  }

  // TENANT VIEW (Default fallback or explicit check)
  // Even if role is null (initially), we might show loading or login redirect.
  // But if we are here, we are logged in.
  // We passed contract to TenantDashboard.

  return <TenantDashboard contract={contract} profile={profile} />

}
