
import React, { useEffect, useState } from 'react';
import { Visit, fetchVisits } from '@/api/visits';
import { VisitCard } from './VisitCard';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function VisitList() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const loadVisits = async () => {
        try {
            setLoading(true);
            const data = await fetchVisits();
            // data is Visit[] because we handled .results in api function
            setVisits(data);
        } catch (error) {
            console.error('Failed to load visits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVisits();
    }, []);

    const role = user?.role || 'user'; // Assuming user object has role

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (visits.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No visits scheduled yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visits.map((visit) => (
                <VisitCard
                    key={visit.id}
                    visit={visit}
                    role={role as 'agent' | 'user'}
                    onUpdate={loadVisits}
                />
            ))}
        </div>
    );
}
