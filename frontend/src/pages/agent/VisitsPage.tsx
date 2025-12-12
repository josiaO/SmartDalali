
import React from 'react';
import { VisitList } from '@/components/visits/VisitList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


export default function VisitsPage() {
    return (
        <div className="container mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Property Visits</CardTitle>
                </CardHeader>
                <CardContent>
                    <VisitList />
                </CardContent>
            </Card>
        </div>
    );
}
