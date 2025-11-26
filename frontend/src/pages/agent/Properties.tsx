import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProperties, useDeleteProperty } from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Eye, Lock } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSubscription } from '@/hooks/useSubscription';
import { checkPermission, FEATURES } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AgentProperties() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  // Fetch only properties owned by the current user
  const { data: propertiesData, isLoading } = useProperties({
    owner: user?.id
  });
  const deleteProperty = useDeleteProperty();
  const { toast } = useToast();

  const canCreateProperty = checkPermission(
    FEATURES.CREATE_PROPERTY,
    user?.role,
    hasActiveSubscription
  );

  const canEditProperty = checkPermission(
    FEATURES.EDIT_PROPERTY,
    user?.role,
    hasActiveSubscription
  );

  const properties = propertiesData?.results || [];

  // Filter properties
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.city.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteProperty.mutateAsync(deleteId);
      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      });
      setDeleteId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete property',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      for_sale: 'default',
      for_rent: 'secondary',
      sold: 'outline',
      rented: 'outline',
    };

    const labels: Record<string, string> = {
      for_sale: 'For Sale',
      for_rent: 'For Rent',
      sold: 'Sold',
      rented: 'Rented',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Properties</h1>
          <p className="text-muted-foreground">
            Manage your property listings
          </p>
        </div>
        {canCreateProperty.allowed ? (
          <Link to="/properties/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </Link>
        ) : (
          <Link to="/payments/subscription">
            <Button variant="outline">
              <Lock className="mr-2 h-4 w-4" />
              Upgrade to Add Properties
            </Button>
          </Link>
        )}
      </div>

      {!canCreateProperty.allowed && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {canCreateProperty.reason}. <Link to="/payments/subscription" className="underline font-medium">Upgrade your subscription</Link> to create and edit property listings.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <CardTitle>All Listings ({filteredProperties.length})</CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="for_sale">For Sale</SelectItem>
                  <SelectItem value="for_rent">For Rent</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all'
                  ? 'No properties found matching your filters'
                  : 'No properties listed yet'}
              </p>
              {!search && statusFilter === 'all' && (
                <Link to="/properties/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Property
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {property.images?.[0] && (
                            <img
                              src={property.images[0]?.image}
                              alt={property.title}
                              className="h-12 w-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{property.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {property.bedrooms} bed • {property.bathrooms} bath
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{property.city}</p>
                          <p className="text-sm text-muted-foreground">
                            {property.address}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          KES {property.price.toLocaleString()}
                        </p>
                        {property.status === 'for_rent' && (
                          <p className="text-xs text-muted-foreground">per month</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="capitalize">{property.property_type}</p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(property.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/properties/${property.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canEditProperty.allowed ? (
                            <Link to={`/properties/${property.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title="Active subscription required"
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(property.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
