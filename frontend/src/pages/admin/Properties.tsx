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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProperties } from '@/hooks/useProperties';
import { Search, Eye, Filter } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatTZS } from '@/lib/currency';

export default function AdminProperties() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Fetch all properties (no owner filter)
    const { data: propertiesData, isLoading } = useProperties();
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

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
            for_sale: 'default',
            for_rent: 'secondary',
            sold: 'outline',
            rented: 'outline',
        };

        return (
            <Badge variant={variants[status] || 'default'}>
                {status.replace('_', ' ')}
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
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <CardTitle>All Properties ({filteredProperties.length})</CardTitle>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search properties..."
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
                <div className="overflow-x-auto">
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
                            {filteredProperties.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No properties found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProperties.map((property) => (
                                    <TableRow key={property.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {property.media?.[0] && (
                                                    <img
                                                        src={property.media[0]?.Images}
                                                        alt={property.title}
                                                        className="h-10 w-14 object-cover rounded"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium truncate max-w-[200px]">{property.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {property.bedrooms} bed • {property.bathrooms} bath
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{property.city}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {property.address}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-sm">
                                                {formatTZS(property.price)}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="capitalize text-sm">{property.property_type}</p>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(property.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link to={`/properties/${property.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
