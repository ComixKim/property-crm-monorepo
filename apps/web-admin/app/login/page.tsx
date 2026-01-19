'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false, // Admin/Manager must exist
            },
        })

        setLoading(false)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Check your email for the code')
            setStep('otp')
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        })

        setLoading(false)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Logged in successfully')
            router.push('/') // Go to Dashboard
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Admin Login</CardTitle>
                    <CardDescription>Enter your email to access the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp} className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@property.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Code
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="otp">Enter 6-digit Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d{6}"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                    maxLength={6}
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Login
                            </Button>
                        </form>
                    )}
                </CardContent>
                {step === 'otp' && (
                    <CardFooter className="flex justify-center">
                        <Button variant="link" size="sm" onClick={() => setStep('email')} disabled={loading}>
                            Change Email
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
