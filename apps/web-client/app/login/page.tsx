'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
                shouldCreateUser: false, // Tenants must be pre-registered by Admin
            }
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("OTP sent to your email")
            setStep('otp')
        }
        setLoading(false)
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Logged in successfully")
            router.push('/')
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-sm shadow-md border-0 sm:border">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome Home</CardTitle>
                    <CardDescription>
                        {step === 'email' ? 'Enter your email to sign in' : `Enter code sent to ${email}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Code
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="otp">One-Time Password</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d{6}"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                                    required
                                    maxLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Login
                            </Button>
                            <Button variant="link" size="sm" onClick={() => setStep('email')} className="text-muted-foreground">
                                Back to email
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
