import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { createSupportTicket, CreateTicketData } from '@/api/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function CreateTicket() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<CreateTicketData>({
        title: '',
        description: '',
        category: '',
        priority: 'low',
    });

    const createTicketMutation = useMutation({
        mutationFn: createSupportTicket,
        onSuccess: () => {
            // Invalidate and refetch support tickets
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            toast({
                title: t('common.success'),
                description: t('notifications.ticket_created'),
            });
            navigate('/support');
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.error || t('notifications.ticket_create_failed'),
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.category) {
            toast({
                title: t('common.error'),
                description: t('form.fill_all_required'),
                variant: 'destructive',
            });
            return;
        }
        createTicketMutation.mutate(formData);
    };

    const categories = [
        'account', 'property', 'payment', 'technical', 'report', 'feature', 'other'
    ];

    const priorities = ['low', 'medium', 'high', 'urgent'];

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{t('support.create_ticket')}</CardTitle>
                    <CardDescription>{t('support.create_ticket_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t('support.subject')} *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t('support.subject_placeholder')}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">{t('support.category')} *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('support.select_category')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {t(`support.categories.${cat}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">{t('support.priority')} *</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('support.select_priority')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {t(`support.priority_levels.${p}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{t('support.description')} *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('support.description_placeholder')}
                                rows={6}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={createTicketMutation.isPending}>
                                {createTicketMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('common.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        {t('common.submit')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
