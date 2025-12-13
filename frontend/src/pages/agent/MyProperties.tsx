import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Building2, Edit, Eye, Heart, Search, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAgentProperties, deleteProperty, updatePropertyStatus, Property } from '@/api/properties';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

export default function MyProperties() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: properties, isLoading } = useQuery({
        queryKey: ['agent-properties'],
        queryFn: getAgentProperties,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProperty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-properties'] });
            toast.success(t('properties.delete_success'));
            setDeleteId(null);
        },
        onError: () => {
            toast.error(t('properties.delete_error'));
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            updatePropertyStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-properties'] });
            toast.success(t('properties.status_updated'));
        },
        onError: () => {
            toast.error(t('properties.status_error'));
        },
    });

    const propertiesList: Property[] = properties || [];
    const filteredProperties = propertiesList.filter((prop: Property) =>
        prop.title.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'sold':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'rented':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'inactive':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t('properties.my_properties')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('dashboard.manage_desc')}
                    </p>
                </div>
                <Link to="/properties/create">
                    <Button>
                        <Building2 className="h-4 w-4 mr-2" />
                        {t('properties.create_new')}
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('properties.all_properties')}</CardTitle>
                    <CardDescription>
                        {filteredProperties.length} {t('properties.total_properties')}
                    </CardDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('properties.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t('common.loading')}
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">
                                {search ? t('properties.no_results') : t('properties.no_properties')}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('properties.title')}</TableHead>
                                        <TableHead>{t('properties.type')}</TableHead>
                                        <TableHead>{t('properties.price')}</TableHead>
                                        <TableHead>{t('properties.status')}</TableHead>
                                        <TableHead className="text-center">{t('properties.views')}</TableHead>
                                        <TableHead className="text-center">{t('properties.likes')}</TableHead>
                                        <TableHead className="text-right">{t('properties.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProperties.map((property: Property) => (
                                        <TableRow key={property.id}>
                                            <TableCell className="font-medium max-w-xs truncate">
                                                {property.title}
                                            </TableCell>
                                            <TableCell>{property.type}</TableCell>
                                            <TableCell>TZS {property.price.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={property.status}
                                                    onValueChange={(value) =>
                                                        statusMutation.mutate({ id: parseInt(property.id), status: value })
                                                    }
                                                >
                                                    <SelectTrigger className="w-[130px]">
                                                        <SelectValue>
                                                            <Badge className={getStatusColor(property.status)}>
                                                                {property.status}
                                                            </Badge>
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">{t('properties.status_active')}</SelectItem>
                                                        <SelectItem value="sold">{t('properties.status_sold')}</SelectItem>
                                                        <SelectItem value="rented">{t('properties.status_rented')}</SelectItem>
                                                        <SelectItem value="inactive">{t('properties.status_inactive')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                    {property.view_count || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Heart className="h-4 w-4 text-muted-foreground" />
                                                    {property.like_count || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => navigate(`/properties/${property.id}/edit`)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteId(parseInt(property.id))}
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

            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('properties.delete_confirm')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('properties.delete_warning')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
