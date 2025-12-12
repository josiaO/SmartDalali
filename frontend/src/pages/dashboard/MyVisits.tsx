
import React from 'react';
import { VisitList } from '@/components/visits/VisitList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function MyVisits() {
    return (
        <div className="container mx-auto py-6">
            <h1 className="text-3xl font-bold mb-6">My Scheduled Visits</h1>
            <VisitList />
        </div>
    );
}
