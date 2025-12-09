import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
    className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
    const location = useLocation();
    const { t } = useTranslation();

    // Split path, remove empty strings, and filter out numeric IDs (optional heuristic)
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Helper to construct route
    const getRouteTo = (index: number) => `/${pathnames.slice(0, index + 1).join('/')}`;

    // Helper to format name (e.g. "create-ticket" -> "Create Ticket") 
    // Ideally this should map to translations
    const formatName = (name: string) => {
        // Try to find translation key for common paths
        const translationKey = `breadcrumbs.${name.replace(/-/g, '_')}`;
        const translated = t(translationKey);

        // If translation missing (returns key), capitalize manually
        if (translated === translationKey) {
            return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        return translated;
    };

    return (
        <nav className={cn("flex items-center text-sm text-muted-foreground py-4", className)}>
            <Link
                to="/"
                className="flex items-center hover:text-foreground transition-colors"
                title={t('common.home')}
            >
                <Home className="h-4 w-4" />
            </Link>

            {pathnames.length > 0 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
            )}

            {pathnames.map((name, index) => {
                const isLast = index === pathnames.length - 1;
                const routeTo = getRouteTo(index);
                // Heuristic: If segment is a long alphanumeric string or looks like an ID, show "Details" or similar
                // This is naive; a better approach uses route matching config.
                const displayName = /^\d+$/.test(name) || name.length > 20
                    ? (t('common.details'))
                    : formatName(name);

                return (
                    <div key={name} className="flex items-center">
                        {isLast ? (
                            <span className="font-medium text-foreground">{displayName}</span>
                        ) : (
                            <Link
                                to={routeTo}
                                className="hover:text-foreground transition-colors"
                            >
                                {displayName}
                            </Link>
                        )}

                        {!isLast && (
                            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
