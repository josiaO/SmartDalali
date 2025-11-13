import { useState } from "react";
import { Users, Search, Filter, UserPlus, Edit, Trash2, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - would come from backend
  const users = [
    {
      id: "1",
      name: "Admin User",
      email: "admin@smartdalali.com",
      role: "superuser",
      status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      joined: "2024-01-15",
      properties: 0,
    },
    {
      id: "2",
      name: "John Agent",
      email: "agent@smartdalali.com",
      role: "agent",
      status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=agent",
      joined: "2024-02-20",
      properties: 8,
      subscription: "Monthly",
    },
    {
      id: "3",
      name: "Jane Buyer",
      email: "user@smartdalali.com",
      role: "user",
      status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
      joined: "2024-03-10",
      properties: 0,
    },
    {
      id: "4",
      name: "Bob Smith",
      email: "bob@example.com",
      role: "agent",
      status: "Trial",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      joined: "2024-10-05",
      properties: 3,
      subscription: "Trial",
    },
    {
      id: "5",
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "user",
      status: "Inactive",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      joined: "2024-05-22",
      properties: 0,
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superuser":
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Admin</Badge>;
      case "agent":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Agent</Badge>;
      case "user":
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case "Trial":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Trial</Badge>;
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage all platform users ({users.length} total)
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Total Users",
            value: users.length,
            color: "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20",
          },
          {
            label: "Active Agents",
            value: users.filter((u) => u.role === "agent" && u.status === "Active").length,
            color: "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20",
          },
          {
            label: "Regular Users",
            value: users.filter((u) => u.role === "user").length,
            color: "bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20",
          },
          {
            label: "Trial Users",
            value: users.filter((u) => u.status === "Trial").length,
            color: "bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20",
          },
        ].map((stat) => (
          <Card key={stat.label} className={stat.color}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="glass-effect">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {user.properties > 0 ? (
                      <span className="font-medium">{user.properties}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.subscription ? (
                      <Badge variant="outline">{user.subscription}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.joined).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Mail className="w-4 h-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <Trash2 className="w-4 h-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
