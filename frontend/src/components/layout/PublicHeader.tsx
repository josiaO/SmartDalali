import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export function PublicHeader() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">REAL ESTATE</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.home')}
          </Link>
          <Link to="/properties" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.properties')}
          </Link>
          <Link to="/support" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.contact')}
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link to={
                user?.role === 'admin' ? '/admin' :
                  user?.role === 'agent' ? '/agent' :
                    '/dashboard'
              }>
                <Button variant="ghost">{t('nav.dashboard')}</Button>
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {user?.first_name} {user?.last_name}
                </span>
                {user?.role && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {user.role === 'admin' ? 'Admin' : user.role === 'agent' ? 'Agent' : 'User'}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost">{t('nav.login')}</Button>
              </Link>
              <Link to="/auth/signup">
                <Button>{t('nav.signup')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
