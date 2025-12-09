import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { BecomeAgentCard } from '@/components/user/BecomeAgentCard';
import { useTranslation } from 'react-i18next';

export default function ListPropertyGateway() {
    const { user } = useAuth();
    const { t } = useTranslation();

    if (user?.role === 'agent' || user?.role === 'admin') {
        return <Navigate to="/properties/create" replace />;
    }

    return (
        <div className="container mx-auto max-w-2xl py-12">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">{t('sidebar.list_property')}</h1>
                <p className="text-muted-foreground">
                    {t('dashboard.list_new_property')}
                </p>
            </div>
            <BecomeAgentCard />
        </div>
    );
}
