import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-12 text-center">
          <h1 className="text-9xl font-bold text-primary mb-4">{t('not_found.title')}</h1>
          <h2 className="text-2xl font-bold mb-4">{t('not_found.subtitle')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('not_found.description')}
          </p>
          <Link to="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              {t('not_found.back_home')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
