import { useState, useEffect } from 'react';
import { fetchFeatures, updateFeature } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Feature {
  id: number;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'coming_soon' | 'disabled';
  is_global: boolean;
  icon?: string;
}

export default function AdminFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    setLoading(true);
    try {
      const data = await fetchFeatures();
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

  async function handleStatusChange(featureId: number, newStatus: string) {
    try {
      await updateFeature(featureId, { status: newStatus as any });
      toast({
        title: 'Success',
        description: 'Feature status updated',
      });
      loadFeatures();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature',
        variant: 'destructive',
      });
    }
  }

  async function toggleGlobal(featureId: number, currentValue: boolean) {
    try {
      await updateFeature(featureId, { is_global: !currentValue });
      toast({
        title: 'Success',
        description: 'Feature visibility updated',
      });
      loadFeatures();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature',
        variant: 'destructive',
      });
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'coming_soon':
        return 'secondary';
      case 'disabled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Management</h1>
          <p className="text-muted-foreground">
            Control feature visibility and availability across all plans
          </p>
        </div>
        <Button onClick={loadFeatures} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Features are defined in your codebase and Django admin.
          Use this panel to control their status and visibility. Changes take effect immediately across all user interfaces.
        </p>
      </div>

      {features.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            No features found. Create features in Django Admin first.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="border rounded-lg p-6 space-y-4 bg-card"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{feature.name}</h3>
                    <Badge variant={getStatusBadgeVariant(feature.status)} className="capitalize">
                      {feature.status.replace('_', ' ')}
                    </Badge>
                    {feature.is_global && (
                      <Badge variant="outline">Global</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Code: <code className="bg-muted px-1.5 py-0.5 rounded">{feature.code}</code>
                  </p>
                  {feature.description && (
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-6 pt-4 border-t">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={feature.status}
                    onValueChange={(value) => handleStatusChange(feature.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Active - Available now
                        </div>
                      </SelectItem>
                      <SelectItem value="coming_soon">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Coming Soon - Planned
                        </div>
                      </SelectItem>
                      <SelectItem value="disabled">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Disabled - Hidden
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Global Visibility</label>
                  <div className="flex items-center space-x-2 h-10">
                    <Switch
                      id={`global-${feature.id}`}
                      checked={feature.is_global}
                      onCheckedChange={() => toggleGlobal(feature.id, feature.is_global)}
                    />
                    <label htmlFor={`global-${feature.id}`} className="text-sm text-muted-foreground cursor-pointer">
                      {feature.is_global ? 'Visible to all' : 'Plan-based'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <strong>Impact:</strong>
                {feature.status === 'active' && ' This feature is currently available to users in plans that include it.'}
                {feature.status === 'coming_soon' && ' This feature shows as "Coming Soon" - users can see it but cannot use it yet.'}
                {feature.status === 'disabled' && ' This feature is completely hidden from all users.'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 border rounded-lg bg-muted/30">
        <h3 className="font-semibold mb-2">Feature Status Guide:</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <strong>Active:</strong> Feature is working and available to users
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <strong>Coming Soon:</strong> Feature is announced but not yet available
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <strong>Disabled:</strong> Feature is hidden from all users
          </li>
        </ul>
      </div>
    </div>
  );
}
