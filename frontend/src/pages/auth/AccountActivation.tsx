import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

export default function AccountActivation() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return; // Prevent multiple chars

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        const newCode = [...code];
        pastedData.forEach((char, index) => {
            if (index < 6) newCode[index] = char;
        });
        setCode(newCode);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const activationCode = code.join('');
        if (activationCode.length !== 6) {
            toast({
                title: 'Invalid Code',
                description: 'Please enter the full 6-digit code.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            await api.post(`/api/v1/accounts/auth/${username}/activate/`, {
                code: activationCode,
            });
            toast({
                title: 'Account Activated',
                description: 'You can now log in.',
            });
            navigate('/login');
        } catch (error: any) {
            toast({
                title: 'Activation Failed',
                description: error.response?.data?.detail || 'Invalid code or expired.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Verify Your Account</CardTitle>
                    <CardDescription>
                        Enter the 6-digit code sent to your email for user <strong>{username}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-between gap-2">
                            {code.map((digit, index) => (
                                <Input
                                    key={index}
                                    id={`code-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    className="w-12 h-12 text-center text-lg"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    required
                                />
                            ))}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Account'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
