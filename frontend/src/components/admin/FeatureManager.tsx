import React, { useState } from 'react';
import { useFeatures } from '@/hooks/useFeatures';
import { usePlans } from '@/hooks/usePlans';
import { Feature } from '@/api/admin';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

export function FeatureManager() {
    const { t } = useTranslation();
    const { features, loading, error, create, update, remove, refetch } = useFeatures();
    const { plans } = usePlans();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentFeature, setCurrentFeature] = useState<Partial<Feature> | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        status: 'active' as 'active' | 'coming_soon' | 'disabled',
    });

    const filteredFeatures = features.filter((feature) => {
        const matchesSearch =
            feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feature.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feature.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && feature.status === 'active') ||
            (filterStatus === 'inactive' && feature.status !== 'active');
        return matchesSearch && matchesStatus;
    });

    const handleOpenDialog = (feature?: Feature) => {
        if (feature) {
            setCurrentFeature(feature);
            setFormData({
                name: feature.name,
                code: feature.code,
                description: feature.description || '',
                status: feature.status,
            });
        } else {
            setCurrentFeature(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                status: 'active',
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentFeature) {
            await update(currentFeature.id!, formData);
        } else {
            await create(formData);
        }
        setIsDialogOpen(false);
        refetch();
    };

    const handleToggleActive = async (feature: Feature) => {
        const newStatus = feature.status === 'active' ? 'disabled' : 'active';
        await update(feature.id, { status: newStatus });
    };

    const handleDelete = async (id: number) => {
        if (confirm(t('admin.delete_feature_confirm'))) {
            await remove(id);
        }
    };

    const getFeaturePlans = (featureId: number) => {
        return plans.filter((plan) => plan.features?.some((f) => f.id === featureId));
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
                <h2 className="text-2xl font-bold">{t('admin.feature_management')}</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('admin.create_feature')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{currentFeature ? t('admin.edit_feature') : t('admin.create_new_feature')}</DialogTitle>
                                <DialogDescription>
                                    {currentFeature
                                        ? t('admin.update_feature_details')
                                        : t('admin.add_new_feature')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('admin.feature_name')}</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Advanced Analytics"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">{t('admin.feature_code')}</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., ADVANCED_ANALYTICS"
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        {t('admin.feature_code_format')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">{t('common.description')}</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe what this feature does..."
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="status"
                                        checked={formData.status === 'active'}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, status: checked ? 'active' : 'disabled' })
                                        }
                                    />
                                    <Label htmlFor="status">{t('common.active')}</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit">{currentFeature ? t('common.update') : t('common.create')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('admin.search_features')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                    >
                        {t('common.all')}
                    </Button>
                    <Button
                        variant={filterStatus === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('active')}
                    >
                        {t('common.active')}
                    </Button>
                    <Button
                        variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('inactive')}
                    >
                        {t('common.inactive')}
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('common.name')}</TableHead>
                            <TableHead>{t('common.code')}</TableHead>
                            <TableHead>{t('common.description')}</TableHead>
                            <TableHead>{t('common.status')}</TableHead>
                            <TableHead>{t('admin.plans')}</TableHead>
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
                        ) : filteredFeatures.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {t('admin.no_features_found')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredFeatures.map((feature) => {
                                const featurePlans = getFeaturePlans(feature.id);
                                return (
                                    <TableRow key={feature.id}>
                                        <TableCell className="font-medium">{feature.name}</TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-muted px-2 py-1 rounded">{feature.code}</code>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {feature.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={feature.status === 'active'}
                                                    onCheckedChange={() => handleToggleActive(feature)}
                                                />
                                                <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                                                    {feature.status === 'active' ? t('common.active') : feature.status === 'coming_soon' ? t('admin.coming_soon') : t('admin.disabled')}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {featurePlans.length > 0 ? (
                                                    featurePlans.map((plan) => (
                                                        <Badge key={plan.id} variant="outline" className="text-xs">
                                                            {plan.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">{t('admin.none')}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(feature)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(feature.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
