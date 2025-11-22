import { UserLayout } from '@/layouts/UserLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, History, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UserDashboard() {
    return (
        <UserLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
                    <p className="text-muted-foreground">
                        Your personal dashboard for managing property searches
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Saved Properties */}
                    <Card className="hover-lift">
                        <CardHeader>
                            <Heart className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Saved Properties</CardTitle>
                            <CardDescription>View your saved properties</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link to="/dashboard/user/saved">View Saved</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Visit History */}
                    <Card className="hover-lift">
                        <CardHeader>
                            <History className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Visit History</CardTitle>
                            <CardDescription>Properties you've viewed</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">No visits history yet</p>
                        </CardContent>
                    </Card>

                    {/* Support */}
                    <Card className="hover-lift">
                        <CardHeader>
                            <HelpCircle className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Support</CardTitle>
                            <CardDescription>Get help or create a ticket</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full">
                                <Link to="/support">View Support Tickets</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </UserLayout>
    );
}
