import { useState, useEffect } from 'react';
import { fetchPlans, createPlan, updatePlan, deletePlan, fetchFeatures, type SubscriptionPlan, type Feature } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

export default function AdminPlans() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        duration_days: 30,
        description: '',
        feature_ids: [] as number[],
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [plansData, featuresData] = await Promise.all([fetchPlans(), fetchFeatures()]);

            const pResults = Array.isArray(plansData) ? plansData : (plansData as any).results || [];
            const fResults = Array.isArray(featuresData) ? featuresData : (featuresData as any).results || [];

            setPlans(pResults);
            setFeatures(fResults);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    function handleOpenDialog(plan?: SubscriptionPlan) {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                price: plan.price,
                duration_days: plan.duration_days,
                description: plan.description,
                feature_ids: plan.features.map(f => f.id),
                is_active: plan.is_active,
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                price: 0,
                duration_days: 30,
                description: '',
                feature_ids: [],
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingPlan) {
                await updatePlan(editingPlan.id, formData);
                toast({ title: 'Success', description: 'Plan updated successfully' });
            } else {
                await createPlan(formData);
                toast({ title: 'Success', description: 'Plan created successfully' });
            }
            setIsDialogOpen(false);
            loadData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save plan',
                variant: 'destructive',
            });
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await deletePlan(id);
            toast({ title: 'Success', description: 'Plan deleted successfully' });
            loadData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete plan',
                variant: 'destructive',
            });
        }
    }

    function toggleFeature(featureId: number) {
        setFormData(prev => {
            const ids = prev.feature_ids.includes(featureId)
                ? prev.feature_ids.filter(id => id !== featureId)
                : [...prev.feature_ids, featureId];
            return { ...prev, feature_ids: ids };
        });
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Subscription Plans</h1>
                    <p className="text-muted-foreground">Manage pricing tiers and included features</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Plan
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-xl">{plan.name}</h3>
                                <p className="text-2xl font-bold mt-1">
                                    {plan.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ {plan.duration_days} days</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">{plan.description}</p>

                        <div className="space-y-2">
                            <p className="font-medium text-sm">Included Features:</p>
                            <ul className="text-sm space-y-1">
                                {plan.features.map(f => (
                                    <li key={f.id} className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> {f.name}
                                    </li>
                                ))}
                                {plan.features.length === 0 && <li className="text-muted-foreground italic">No features assigned</li>}
                            </ul>
                        </div>

                        <div className="pt-4 border-t flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {plan.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Plan Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (Days)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={formData.duration_days}
                                onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Included Features</Label>
                            <div className="grid grid-cols-2 gap-2 border rounded-md p-4">
                                {features.map((feature) => (
                                    <div key={feature.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`f-${feature.id}`}
                                            checked={formData.feature_ids.includes(feature.id)}
                                            onCheckedChange={() => toggleFeature(feature.id)}
                                        />
                                        <Label htmlFor={`f-${feature.id}`} className="cursor-pointer font-normal">
                                            {feature.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
