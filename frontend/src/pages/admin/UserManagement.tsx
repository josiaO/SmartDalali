import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield, User as UserIcon, Crown, Loader2, Search } from 'lucide-react';
import api from '@/lib/axios';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  groups: string[];
  role: 'admin' | 'agent' | 'user';
  profile?: {
    name: string;
    phone_number: string;
  };
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'agent' | 'user'>('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      // Request all users by setting a high page_size
      params.append('page_size', '1000');

      const response = await api.get<User[] | { results: User[] }>(`/api/v1/accounts/users/?${params.toString()}`);
      // Handle both direct array and paginated response
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.post(`/api/v1/accounts/users/${userId}/toggle_agent_status/`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(data.message || 'User role updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user role');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.post(`/api/v1/accounts/users/${userId}/toggle_active_status/`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(data.message || 'User status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    },
  });

  const getRoleBadge = (user: User) => {
    const config = {
      admin: { icon: Crown, variant: 'destructive' as const, label: 'Admin' },
      agent: { icon: Shield, variant: 'default' as const, label: 'Agent' },
      user: { icon: UserIcon, variant: 'secondary' as const, label: 'User' },
    };

    const { icon: Icon, variant, label } = config[user.role];

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</div>
                    {user.profile?.name && (
                      <div className="text-xs text-muted-foreground">{user.profile.name}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.profile?.phone_number || '-'}</TableCell>
                <TableCell>{getRoleBadge(user)}</TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.date_joined).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {!user.is_superuser && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAgentMutation.mutate(user.id)}
                        disabled={toggleAgentMutation.isPending}
                      >
                        {user.groups.includes('agent') ? 'Remove Agent' : 'Make Agent'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={user.is_active ? 'destructive' : 'default'}
                      onClick={() => toggleActiveMutation.mutate(user.id)}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
