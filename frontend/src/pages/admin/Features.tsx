import { useState, useEffect } from 'react';
import { fetchFeatures, createFeature, updateFeature, deleteFeature, type Feature } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

export default function AdminFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const data = await fetchFeatures();
      // Handle pagination result or direct array
      const results = Array.isArray(data) ? data : (data as any).results || [];
      setFeatures(results);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load features',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenDialog(feature?: Feature) {
    if (feature) {
      setEditingFeature(feature);
      setFormData({
        name: feature.name,
        code: feature.code,
        description: feature.description,
        is_active: feature.is_active,
      });
    } else {
      setEditingFeature(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingFeature) {
        await updateFeature(editingFeature.id, formData);
        toast({ title: 'Success', description: 'Feature updated successfully' });
      } else {
        await createFeature(formData);
        toast({ title: 'Success', description: 'Feature created successfully' });
      }
      setIsDialogOpen(false);
      loadFeatures();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save feature',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    try {
      await deleteFeature(id);
      toast({ title: 'Success', description: 'Feature deleted successfully' });
      loadFeatures();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete feature',
        variant: 'destructive',
      });
    }
  }

  async function toggleStatus(feature: Feature) {
    try {
      await updateFeature(feature.id, { is_active: !feature.is_active });
      loadFeatures();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Management</h1>
          <p className="text-muted-foreground">Manage system features and capabilities</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.id}>
                <TableCell className="font-medium">{feature.name}</TableCell>
                <TableCell><code className="bg-muted px-1 py-0.5 rounded">{feature.code}</code></TableCell>
                <TableCell>{feature.description}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={feature.is_active}
                      onCheckedChange={() => toggleStatus(feature)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {feature.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(feature)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(feature.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {features.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No features found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFeature ? 'Edit Feature' : 'Create Feature'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code (Unique Identifier)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={!!editingFeature} // Prevent changing code after creation
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
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="coming_soon"
                checked={formData.name.startsWith('[Coming Soon] ')}
                onCheckedChange={(checked) => {
                  const cleanName = formData.name.replace('[Coming Soon] ', '');
                  setFormData({
                    ...formData,
                    name: checked ? `[Coming Soon] ${cleanName}` : cleanName
                  });
                }}
              />
              <Label htmlFor="coming_soon">Mark as Coming Soon</Label>
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
