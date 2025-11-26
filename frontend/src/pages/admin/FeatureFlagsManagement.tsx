import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings, Lock, Loader2 } from 'lucide-react';
import { fetchFeatures, toggleFeatureStatus, type Feature } from '@/api/subscriptions';

export default function FeatureFlagsManagement() {
  const queryClient = useQueryClient();

  const { data: features, isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: fetchFeatures,
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleFeatureStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature flag updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update feature flag');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading features...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags Management</CardTitle>
        <p className="text-sm text-muted-foreground">
          Control which features are available globally in the system
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features && features.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No features found. Create features in the Features tab.
            </div>
          )}
          {features?.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="h-4 w-4" />
                  <h3 className="font-semibold">{feature.name}</h3>
                  <Badge variant={feature.is_active ? 'default' : 'secondary'}>
                    {feature.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {feature.description && (
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Code: <code className="bg-muted px-1 py-0.5 rounded">{feature.code}</code>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {feature.is_active ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feature.is_active ? 'Available to users' : 'Hidden from users'}
                  </div>
                </div>
                <Switch
                  checked={feature.is_active}
                  onCheckedChange={(checked) =>
                    toggleFeatureMutation.mutate({ id: feature.id, isActive: checked })
                  }
                  disabled={toggleFeatureMutation.isPending}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
