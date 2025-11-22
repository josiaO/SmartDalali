import { AgentLayout } from '@/layouts/AgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Plus, TrendingUp, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AgentDashboard() {
    return (
        <AgentLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
                        <p className="text-muted-foreground">
                            Manage your properties and grow your business
                        </p>
                    </div>
                    <Button asChild size="lg" className="gap-2">
                        <Link to="/properties/create">
                            <Plus className="h-5 w-5" />
                            Add New Property
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">0</CardTitle>
                            <CardDescription>Listed Properties</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">0</CardTitle>
                            <CardDescription>Total Views</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">0</CardTitle>
                            <CardDescription>Inquiries</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-accent">Active</CardTitle>
                            <CardDescription>Subscription Status</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover-lift">
                        <CardHeader>
                            <Home className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>My Properties</CardTitle>
                            <CardDescription>View and manage all your listings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link to="/dashboard/agent/properties">View Properties</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="hover-lift">
                        <CardHeader>
                            <TrendingUp className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Performance</CardTitle>
                            <CardDescription>Track your listing statistics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Coming soon</p>
                        </CardContent>
                    </Card>

                    <Card className="hover-lift">
                        <CardHeader>
                            <CreditCard className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Subscription</CardTitle>
                            <CardDescription>Manage your subscription plan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full" disabled>
                                <Link to="/payments/subscription">View Plans</Link>
                            </Button>
                            <p className="text-xs text-center text-muted-foreground mt-2">Coming soon</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AgentLayout>
    );
}
