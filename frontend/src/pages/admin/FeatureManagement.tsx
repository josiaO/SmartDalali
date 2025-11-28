import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureManager } from '@/components/admin/FeatureManager';
import { PlanManager } from '@/components/admin/PlanManager';
import { Settings, Package } from 'lucide-react';

export default function FeatureManagement() {
    const [activeTab, setActiveTab] = useState('features');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Feature & Plan Management</h1>
                <p className="text-muted-foreground mt-2">
                    Manage features and subscription plans for your platform
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="features" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Features
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="gap-2">
                        <Package className="h-4 w-4" />
                        Plans
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Registry</CardTitle>
                            <CardDescription>
                                Create and manage features that can be assigned to subscription plans.
                                Features control access to specific functionality across the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FeatureManager />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plans</CardTitle>
                            <CardDescription>
                                Create and manage subscription plans with different pricing tiers and feature sets.
                                Attach features to plans to control user access.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PlanManager />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
