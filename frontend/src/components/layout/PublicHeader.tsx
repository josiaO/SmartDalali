import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function PublicHeader() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link
        to="/"
        className={`text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ${mobile ? 'block py-2' : ''}`}
        onClick={() => mobile && setIsOpen(false)}
      >
        {t('nav.home')}
      </Link>
      <Link
        to="/properties"
        className={`text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ${mobile ? 'block py-2' : ''}`}
        onClick={() => mobile && setIsOpen(false)}
      >
        {t('nav.properties')}
      </Link>
      <Link
        to="/support"
        className={`text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ${mobile ? 'block py-2' : ''}`}
        onClick={() => mobile && setIsOpen(false)}
      >
        {t('nav.contact')}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">SmartDalali</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </nav>

        <div className="flex items-center space-x-4">
          <LanguageSwitcher />

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-4 mt-6">
                  <NavLinks mobile />
                  <div className="pt-4 border-t">
                    {isAuthenticated ? (
                      <div className="flex flex-col space-y-3">
                        <Link to={
                          user?.role === 'admin' ? '/admin' :
                            user?.role === 'agent' ? '/agent/dashboard' :
                              '/dashboard'
                        } onClick={() => setIsOpen(false)}>
                          <Button className="w-full">{t('nav.dashboard')}</Button>
                        </Link>
                        <div className="text-sm text-muted-foreground text-center">
                          {user?.first_name} {user?.last_name}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-3">
                        <Link to="/auth/login" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full">{t('nav.login')}</Button>
                        </Link>
                        <Link to="/auth/signup" onClick={() => setIsOpen(false)}>
                          <Button className="w-full">{t('nav.signup')}</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to={
                  user?.role === 'admin' ? '/admin' :
                    user?.role === 'agent' ? '/agent/dashboard' :
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
      </div>
    </header>
  );
}
