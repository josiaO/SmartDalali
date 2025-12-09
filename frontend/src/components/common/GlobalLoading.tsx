import { useIsFetching } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';

export function GlobalLoading() {
    const isFetching = useIsFetching();

    if (!isFetching) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-background/80 backdrop-blur-sm shadow-sm border rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <RotateCw className="h-3 w-3 animate-spin" />
                <span>Loading...</span>
            </div>
        </div>
    );
}
