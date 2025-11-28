import { useState, useEffect } from 'react';
import { fetchPlans, createPlan, updatePlan, deletePlan, fetchFeatures } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

interface Feature {
    id: number;
    name: string;
    code: string;
    description: string;
    status: string;
}

interface Plan {
    id: number;
    title: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
    highlight: boolean;
    features: { feature: Feature; included: boolean }[];
}

export default function AdminPlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        price_monthly: 0,
        price_yearly: 0,
        highlight: false,
        feature_ids: [] as number[]
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

    function handleOpenDialog(plan?: Plan) {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                title: plan.title,
                slug: plan.slug,
                price_monthly: plan.price_monthly,
                price_yearly: plan.price_yearly,
                highlight: plan.highlight,
                feature_ids: plan.features.map(f => f.feature.id)
            });
        } else {
            setEditingPlan(null);
            setFormData({
                title: '',
                slug: '',
                price_monthly: 0,
                price_yearly: 0,
                highlight: false,
                feature_ids: []
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
                    <h1 className="text-3xl font-bold">Pricing Plans</h1>
                    <p className="text-muted-foreground">Manage subscription tiers and features</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Plan
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <div key={plan.id} className={`border rounded-lg p-6 space-y-4 ${plan.highlight ? 'ring-2 ring-primary' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-xl">{plan.title}</h3>
                                {plan.highlight && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Popular</span>}
                                <div className="mt-2 space-y-1">
                                    <p className="text-2xl font-bold">
                                        ${Number(plan.price_monthly).toLocaleString()}
                                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                                    </p>
                                    <p className="text-lg">
                                        ${Number(plan.price_yearly).toLocaleString()}
                                        <span className="text-sm font-normal text-muted-foreground">/year</span>
                                    </p>
                                </div>
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

                        <div className="space-y-2">
                            <p className="font-medium text-sm">Features:</p>
                            <ul className="text-sm space-y-1">
                                {plan.features.filter(f => f.included).map(pf => (
                                    <li key={pf.feature.id} className="flex items-center gap-2">
                                        <span className="text-primary">✓</span>
                                        {pf.feature.name}
                                        {pf.feature.status === 'coming_soon' && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Coming Soon</span>
                                        )}
                                    </li>
                                ))}
                                {plan.features.filter(f => f.included).length === 0 && (
                                    <li className="text-muted-foreground italic">No features assigned</li>
                                )}
                            </ul>
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
                                <Label htmlFor="title">Plan Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price_monthly">Monthly Price</Label>
                                <Input
                                    id="price_monthly"
                                    type="number"
                                    value={formData.price_monthly}
                                    onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price_yearly">Yearly Price</Label>
                                <Input
                                    id="price_yearly"
                                    type="number"
                                    value={formData.price_yearly}
                                    onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                                    required
                                />
                            </div>
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
                                            {feature.status === 'coming_soon' && (
                                                <span className="ml-2 text-xs text-yellow-600">(Soon)</span>
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="highlight"
                                checked={formData.highlight}
                                onCheckedChange={(checked) => setFormData({ ...formData, highlight: checked })}
                            />
                            <Label htmlFor="highlight">Mark as Popular</Label>
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
