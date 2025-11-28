import { useState } from 'react';
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
    if (user?.groups?.some((g: any) => g.name === 'agent')) {
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
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('profile.upgrade_error'));
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

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full" size="lg">
                                {t('profile.upgrade_now')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('profile.become_agent_title')}</DialogTitle>
                                <DialogDescription>
                                    {t('profile.upgrade_dialog_desc')}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="agency_name">{t('profile.agency_name')}</Label>
                                    <Input
                                        id="agency_name"
                                        placeholder={t('profile.agency_name_placeholder')}
                                        value={formData.agency_name}
                                        onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t('profile.phone_number')}</Label>
                                    <Input
                                        id="phone"
                                        placeholder={t('profile.phone_placeholder')}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? t('common.processing') : t('profile.confirm_upgrade')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}
