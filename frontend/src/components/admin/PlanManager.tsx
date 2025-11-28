import React, { useState } from 'react';
import { usePlans } from '@/hooks/usePlans';
import { useFeatures } from '@/hooks/useFeatures';
import { SubscriptionPlan } from '@/api/admin';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

export function PlanManager() {
    const { t } = useTranslation();
    const { plans, loading, error, create, update, remove, refetch } = usePlans();
    const { features } = useFeatures();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        duration_days: 30,
        description: '',
        feature_ids: [] as number[],
        is_active: true,
    });

    const handleOpenDialog = (plan?: SubscriptionPlan) => {
        if (plan) {
            setCurrentPlan(plan);
            setFormData({
                name: plan.name,
                price_monthly: plan.price_monthly || 0,
                price_yearly: plan.price_yearly || 0,
                duration_days: plan.duration_days,
                description: plan.description,
                feature_ids: plan.features?.map((f) => f.id) || [],
                is_active: plan.is_active,
            });
        } else {
            setCurrentPlan(null);
            setFormData({
                name: '',
                price_monthly: 0,
                price_yearly: 0,
                duration_days: 30,
                description: '',
                feature_ids: [],
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            price: formData.price_monthly, // Legacy field for backward compatibility
        };
        if (currentPlan) {
            await update(currentPlan.id, submitData);
        } else {
            await create(submitData);
        }
        setIsDialogOpen(false);
        refetch();
    };

    const handleDelete = async (id: number) => {
        if (confirm(t('admin.delete_plan_confirm'))) {
            await remove(id);
        }
    };

    const handleFeatureToggle = (featureId: number, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            feature_ids: checked
                ? [...prev.feature_ids, featureId]
                : prev.feature_ids.filter((id) => id !== featureId),
        }));
    };

    const formatPrice = (price?: number) => {
        if (!price) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t('admin.plan_management')}</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('admin.create_plan')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{currentPlan ? t('admin.edit_plan') : t('admin.create_new_plan')}</DialogTitle>
                                <DialogDescription>
                                    {currentPlan ? t('admin.update_plan_details') : t('admin.add_new_plan')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="name">{t('admin.plan_name')}</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Premium Plan"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price_monthly">{t('admin.monthly_price')}</Label>
                                        <Input
                                            id="price_monthly"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price_monthly}
                                            onChange={(e) =>
                                                setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price_yearly">{t('admin.yearly_price')}</Label>
                                        <Input
                                            id="price_yearly"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price_yearly}
                                            onChange={(e) =>
                                                setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })
                                            }
                                        />
                                        <p className="text-sm text-muted-foreground">{t('common.optional')}</p>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="duration_days">{t('admin.duration_days')}</Label>
                                        <Input
                                            id="duration_days"
                                            type="number"
                                            min="1"
                                            value={formData.duration_days}
                                            onChange={(e) =>
                                                setFormData({ ...formData, duration_days: parseInt(e.target.value) })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="description">{t('common.description')}</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe what this plan offers..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>{t('admin.features_included')}</Label>
                                    <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                                        {features.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                {t('admin.no_features_available')}
                                            </p>
                                        ) : (
                                            features.map((feature) => (
                                                <div key={feature.id} className="flex items-start gap-3">
                                                    <Checkbox
                                                        id={`feature-${feature.id}`}
                                                        checked={formData.feature_ids.includes(feature.id)}
                                                        onCheckedChange={(checked) =>
                                                            handleFeatureToggle(feature.id, checked as boolean)
                                                        }
                                                        disabled={feature.status !== 'active'}
                                                    />
                                                    <div className="flex-1 space-y-1">
                                                        <Label
                                                            htmlFor={`feature-${feature.id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {feature.name}
                                                            {feature.status !== 'active' && (
                                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                                    {feature.status === 'coming_soon' ? t('admin.coming_soon') : t('admin.disabled')}
                                                                </Badge>
                                                            )}
                                                        </Label>
                                                        {feature.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {feature.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit">{currentPlan ? t('common.update') : t('common.create')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('admin.plan_name')}</TableHead>
                            <TableHead>{t('admin.pricing')}</TableHead>
                            <TableHead>{t('admin.duration')}</TableHead>
                            <TableHead>{t('property.features')}</TableHead>
                            <TableHead>{t('common.status')}</TableHead>
                            <TableHead className="text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : plans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {t('admin.no_plans_found')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {plan.price_monthly && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <DollarSign className="h-3 w-3" />
                                                    {formatPrice(plan.price_monthly)}/mo
                                                </div>
                                            )}
                                            {plan.price_yearly && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <DollarSign className="h-3 w-3" />
                                                    {formatPrice(plan.price_yearly)}/yr
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{plan.duration_days} {t('admin.days')}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {plan.features && plan.features.length > 0 ? (
                                                plan.features.map((feature) => (
                                                    <Badge
                                                        key={feature.id}
                                                        variant={feature.status === 'active' ? 'default' : 'secondary'}
                                                        className="text-xs"
                                                    >
                                                        {feature.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground">{t('admin.no_features')}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                            {plan.is_active ? t('common.active') : t('common.inactive')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
