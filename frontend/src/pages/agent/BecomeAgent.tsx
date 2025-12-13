import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { upgradeToAgent } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Phone } from 'lucide-react';
import { AxiosError } from 'axios';

interface AgentFormData {
    agency_name: string;
    phone: string;
}

export default function BecomeAgent() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<AgentFormData>();

    const onSubmit = async (data: AgentFormData) => {
        setLoading(true);
        try {
            await upgradeToAgent(data);
            await refreshUser();
            toast.success('Successfully upgraded to Agent account!');
            navigate('/properties/create'); // Direct to action
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                console.error('Upgrade failed:', error);
                toast.error(error.response?.data?.error || 'Failed to upgrade account');
            } else {
                console.error('Upgrade failed:', error);
                toast.error('Failed to upgrade account');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Become an Agent</CardTitle>
                    <CardDescription>
                        Start listing properties and reaching more clients today.
                        It's free for Version 1 users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="agency_name">Agency Name (Optional)</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="agency_name"
                                    placeholder="e.g. Dream Homes Realty"
                                    className="pl-9"
                                    {...register('agency_name')}
                                 />
                            </div>
                            <p className="text-xs text-muted-foreground">If you work independently, you can leave this blank or use your name.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Business Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    placeholder="+255..."
                                    className="pl-9"
                                    {...register('phone', { required: 'Phone number is required' })}
                                 />
                            </div>
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? (
                                <>
                                    <LoadingSpinner className="mr-2 h-4 w-4" />
                                    Processing...
                                </>
                            ) : (
                                'Upgrade and Start Listing'
                            )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            By upgrading, you agree to our Terms of Service for Agents.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
