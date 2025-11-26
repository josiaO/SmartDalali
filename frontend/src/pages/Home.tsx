import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Shield,
  TrendingUp,
  ArrowRight,
  Home as HomeIcon,
  Users,
  MapPin,
  Star,
  CheckCircle,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { getPublicStats } from '@/api/properties';

export default function Home() {
  const { t } = useTranslation();

  const { data: publicStats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: getPublicStats,
  });

  const features = [
    { icon: Shield, title: t('home.features.verified.title'), description: t('home.features.verified.description'), color: 'primary' },
    { icon: Search, title: t('home.features.search.title'), description: t('home.features.search.description'), color: 'accent' },
    { icon: TrendingUp, title: t('home.features.insights.title'), description: t('home.features.insights.description'), color: 'primary' },
    { icon: Users, title: t('home.features.agents.title'), description: t('home.features.agents.description'), color: 'accent' },
    { icon: MapPin, title: t('home.features.locations.title'), description: t('home.features.locations.description'), color: 'primary' },
    { icon: Star, title: t('home.features.support.title'), description: t('home.features.support.description'), color: 'accent' },
  ];

  const stats = [
    { value: publicStats?.properties ? `${publicStats.properties}+` : '0+', label: t('home.stats.properties') },
    { value: publicStats?.agents ? `${publicStats.agents}+` : '0+', label: t('home.stats.agents') },
    { value: publicStats?.users ? `${publicStats.users}+` : '0+', label: t('home.stats.users') },
    { value: publicStats?.satisfaction ? `${publicStats.satisfaction}%` : '0%', label: t('home.stats.satisfaction') },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <HomeIcon className="h-4 w-4" />
              {t('home.hero.badge')}
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {t('home.hero.title')} <span className="text-primary">SmartDalali</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/properties">
                <Button size="lg" className="w-full sm:w-auto">
                  {t('home.hero.browse')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t('home.hero.getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm md:text-base opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('home.about.title')}</h2>
              <p className="text-muted-foreground text-lg mb-6">{t('home.about.description')}</p>
              <div className="space-y-4">
                {[t('home.about.point1'), t('home.about.point2'), t('home.about.point3')].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Building2 className="h-32 w-32 text-primary/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.features.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('home.features.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const bgColor = feature.color === 'primary' ? 'bg-primary/10' : 'bg-accent/10';
              const textColor = feature.color === 'primary' ? 'text-primary' : 'text-accent';
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${bgColor}`}>
                      <Icon className={`h-7 w-7 ${textColor}`} />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.howItWorks.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('home.howItWorks.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{ step: '1', title: t('home.howItWorks.step1.title'), description: t('home.howItWorks.step1.description') },
            { step: '2', title: t('home.howItWorks.step2.title'), description: t('home.howItWorks.step2.description') },
            { step: '3', title: t('home.howItWorks.step3.title'), description: t('home.howItWorks.step3.description') }].map((item, i) => (
              <div key={i} className="text-center">
                <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">{item.step}</div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">{t('home.cta.title')}</h2>
          <p className="mb-8 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">{t('home.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">{t('home.cta.signup')}</Button>
            </Link>
            <Link to="/properties">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">{t('home.cta.explore')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-6">{t('home.contact.title')}</h3>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <span>+255 123 456 789</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <span>info@smartdalali.co.tz</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
