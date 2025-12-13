import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { upgradeToAgent } from '@/api/auth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';

export function BecomeAgentCard() {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        agency_name: '',
        phone: user?.profile?.phone_number || '',
    });

    // Don't show the card if user is already an agent
    if (user?.groups?.some((g: string) => g === 'agent')) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await upgradeToAgent(formData);
            await refreshUser();
            toast.success(t('profile.upgrade_success'));
            setOpen(false);
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                if (error.response?.data?.error) {
                    toast.error(error.response.data.error);
                } else {
                    toast.error(t('profile.upgrade_error'));
                }
            } else {
                toast.error(t('profile.upgrade_error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-xl">{t('profile.become_agent_title')}</CardTitle>
                        <CardDescription className="mt-1">
                            {t('profile.become_agent_desc')}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>{t('profile.benefit_list_properties')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>{t('profile.benefit_manage_clients')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>{t('profile.benefit_premium_features')}</span>
                        </div>
                    </div>

                    <Link to="/become-agent">
                        <Button className="w-full" size="lg">
                            {t('profile.upgrade_now')}
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
