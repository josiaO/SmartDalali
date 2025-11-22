import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface PublicLayoutProps {
    children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Simple Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-screen-xl mx-auto">
                    <Link to={ROUTES.HOME} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-white font-bold text-xl">D</span>
                            </div>
                            <span className="hidden sm:inline-block font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                SmartDalali
                            </span>
                        </div>
                    </Link>

                    <nav className="flex items-center space-x-4">
                        <Link to={ROUTES.PROPERTIES}>
                            <Button variant="ghost">Browse Properties</Button>
                        </Link>
                        <Link to={ROUTES.LOGIN}>
                            <Button>Sign In</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t py-8 bg-muted/30">
                <div className="container px-4 md:px-8 max-w-screen-xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                                <span className="text-white font-bold text-sm">D</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                © 2025 SmartDalali. All rights reserved.
                            </span>
                        </div>
                        <nav className="flex gap-6 text-sm text-muted-foreground">
                            <Link to="/about" className="hover:text-foreground transition-colors">
                                About
                            </Link>
                            <Link to="/terms" className="hover:text-foreground transition-colors">
                                Terms
                            </Link>
                            <Link to={ROUTES.SUPPORT} className="hover:text-foreground transition-colors">
                                Support
                            </Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}
