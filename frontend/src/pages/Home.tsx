import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Search, Shield, TrendingUp, ArrowRight, Home as HomeIcon,
  Users, MapPin, Star, CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPublicStats, fetchProperties } from '@/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: publicStats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: getPublicStats,
  });

  useEffect(() => {
    document.title = "SmartDalali - Nyumba, Viwanja, na Magari | Home of Trust";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', "Pata nyumba, viwanja, ofisi na majumba ya kifahari kwa urahisi SmartDalali. Mtandao wako wa kuaminika kwa mali safi.");
    }
  }, []);

  const { data: properties, isLoading: loadingProperties } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => fetchProperties({ ordering: '-view_count' }), // Featured = Most Viewed
  });

  const handleListProperty = () => {
    if (!user) {
      navigate('/auth/signup?redirect=/become-agent');
    } else if (user.role === 'user') {
      navigate('/become-agent');
    } else {
      navigate('/properties/create');
    }
  };

  const features = [
    { icon: Shield, title: t('home.features.verified.title'), description: t('home.features.verified.description'), color: 'primary' },
    { icon: Search, title: t('home.features.search.title'), description: t('home.features.search.description'), color: 'accent' },
    { icon: TrendingUp, title: t('home.features.insights.title'), description: t('home.features.insights.description'), color: 'primary' },
    { icon: Users, title: t('home.features.agents.title'), description: t('home.features.agents.description'), color: 'accent' },
    { icon: MapPin, title: t('home.features.locations.title'), description: t('home.features.locations.description'), color: 'primary' },
    { icon: Star, title: t('home.features.support.title'), description: t('home.features.support.description'), color: 'accent' },
  ];

  const stats = [
    { value: publicStats?.properties ? `${publicStats.properties} +` : '0+', label: t('home.stats.properties') },
    { value: publicStats?.agents ? `${publicStats.agents} +` : '0+', label: t('home.stats.agents') },
    { value: publicStats?.users ? `${publicStats.users} +` : '0+', label: t('home.stats.users') },
    { value: publicStats?.satisfaction ? `${publicStats.satisfaction}% ` : '0%', label: t('home.stats.satisfaction') },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden min-h-[85vh] flex items-center justify-center">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10" /> {/* Darkened Overlay */}
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Modern House in Tanzania"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-4 relative z-20 text-center">

          {/* 1. Hero Title (SEO-Optimized) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-md leading-tight">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-medium max-w-2xl mx-auto drop-shadow-sm">
              {t('home.hero.subtitle')}
            </p>
          </motion.div>

          {/* 2. Primary CTA Mobile Only (for quick access) */}
          <div className="md:hidden mb-8">
            <Link to="/properties">
              <Button size="lg" className="w-full text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg">
                {t('home.hero.browse')}
              </Button>
            </Link>
          </div>

          {/* 3. Search Bar (Central and Powerful) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-2xl max-w-5xl mx-auto mb-10 text-left"
          >
            <form
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const params = new URLSearchParams();
                if (formData.get('search')) params.append('search', formData.get('search') as string);
                if (formData.get('location')) params.append('city', formData.get('location') as string);
                if (formData.get('type')) params.append('type', formData.get('type') as string);
                if (formData.get('min_price')) params.append('min_price', formData.get('min_price') as string);
                if (formData.get('max_price')) params.append('max_price', formData.get('max_price') as string);
                navigate(`/properties?${params.toString()}`);
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  name="search"
                  type="text"
                  placeholder={t('home.search_bar.keyword')}
                  className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  name="location"
                  type="text"
                  placeholder={t('home.search_bar.location')}
                  className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="relative">
                <HomeIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <select
                  name="type"
                  className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-background"
                  defaultValue=""
                >
                  <option value="" disabled>{t('home.search_bar.type')}</option>
                  <option value="House">{t('home.categories.houses')}</option>
                  <option value="Apartment">{t('home.categories.apartments')}</option>
                  <option value="Office">{t('home.categories.offices')}</option>
                  <option value="Land">{t('home.categories.plots')}</option>
                  <option value="Villa">{t('home.categories.villas')}</option>
                  <option value="Shop">{t('home.categories.shops')}</option>
                  <option value="Warehouse">{t('home.categories.warehouses')}</option>
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground text-sm font-medium">TSh</span>
                <input
                  name="min_price"
                  type="number"
                  placeholder={t('home.search_bar.min_price')}
                  className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground text-sm font-medium">TSh</span>
                <input
                  name="max_price"
                  type="number"
                  placeholder={t('home.search_bar.max_price')}
                  className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button type="submit" size="lg" className="w-full font-bold text-lg bg-primary hover:bg-primary/90 shadow-md">
                {t('home.search_bar.search_btn')}
              </Button>
            </form>
          </motion.div>

          {/* 4. Quick-Category Buttons */}
          <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <Link to="/properties?type=House">
              <Button variant="secondary" className="backdrop-blur-md bg-white/20 hover:bg-white/40 text-white border border-white/30 rounded-full px-6 transition-all hover:scale-105">
                🏠 {t('home.categories.houses')}
              </Button>
            </Link>
            <Link to="/properties?type=Apartment">
              <Button variant="secondary" className="backdrop-blur-md bg-white/20 hover:bg-white/40 text-white border border-white/30 rounded-full px-6 transition-all hover:scale-105">
                🏢 {t('home.categories.apartments')}
              </Button>
            </Link>
            <Link to="/properties?type=Office">
              <Button variant="secondary" className="backdrop-blur-md bg-white/20 hover:bg-white/40 text-white border border-white/30 rounded-full px-6 transition-all hover:scale-105">
                💼 {t('home.categories.offices')}
              </Button>
            </Link>
            <Link to="/properties?type=Land">
              <Button variant="secondary" className="backdrop-blur-md bg-white/20 hover:bg-white/40 text-white border border-white/30 rounded-full px-6 transition-all hover:scale-105">
                🏡 {t('home.categories.plots')}
              </Button>
            </Link>
            <Link to="/properties?type=Villa">
              <Button variant="secondary" className="backdrop-blur-md bg-white/20 hover:bg-white/40 text-white border border-white/30 rounded-full px-6 transition-all hover:scale-105">
                🏰 {t('home.categories.villas')}
              </Button>
            </Link>
            <Link to="/properties?type=Shop">
              <Button variant="secondary" className="backdrop-blur-md bg-white/20 hover:bg-white/40 text-white border border-white/30 rounded-full px-6 transition-all hover:scale-105">
                🏪 {t('home.categories.shops')}
              </Button>
            </Link>
            <Link to="/properties?type=Warehouse">
              <Button variant="secondary" className="backdrop-blur-md bg-white/20 hover:bg-white/40 text-white border border-white/30 rounded-full px-6 transition-all hover:scale-105">
                🏭 {t('home.categories.warehouses')}
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* 5. Trust Elements Section */}
      <section className="bg-white py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 lg:gap-16 text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>{t('home.trust.verified')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>{t('home.trust.agents')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>{t('home.trust.updated')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>{t('home.trust.fastest')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Carousel */}
      <section className="py-16 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">{t('home.hero.search_title')}</h2>
              <p className="text-muted-foreground">{t('home.features.subtitle')}</p>
            </div>
            <Link to="/properties">
              <Button variant="outline" className="hidden md:flex items-center gap-2">
                {t('dashboard.view_all')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loadingProperties ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="relative px-4 md:px-12">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 3000,
                  }),
                ]}
                className="w-full max-w-7xl mx-auto"
              >
                <CarouselContent className="-ml-4">
                  {properties?.results?.slice(0, 10).map((property: any) => (
                    <CarouselItem key={property.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <div className="h-full">
                        <PropertyCard property={property} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4 bg-white/80 hover:bg-white text-primary border-primary/20" />
                <CarouselNext className="hidden md:flex -right-4 bg-white/80 hover:bg-white text-primary border-primary/20" />
              </Carousel>

              {!properties?.results?.length && (
                <div className="text-center py-12 text-muted-foreground">
                  {t('properties.no_properties')}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link to="/properties">
              <Button variant="outline" className="w-full">
                {t('dashboard.view_all')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. SEO-Optimized Text Section */}
      <section className="bg-muted/10 py-16">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-2xl font-bold mb-4 sr-only">About SmartDalali</h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            <strong className="text-foreground">SmartDalali</strong> {t('home.seo.line1')}
            {t('home.seo.line2')}
            {t('home.seo.line3')}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm md:text-base opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid ("Why Choose SmartDalali") */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">{t('home.features.title')}</h2>
            <p className="text-muted-foreground">{t('home.features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="pt-8">
                      <div className={`h - 12 w - 12 rounded - lg flex items - center justify - center mb - 6 transition - colors ${feature.color === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground' : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground'} `}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Simple CTA for Upgrade */}
      {(!user || user.role === 'user') && (
        <section className="py-24 bg-background border-t">
          <div className="container mx-auto px-4">
            <div className="bg-primary/5 rounded-3xl p-8 md:p-16 text-center max-w-5xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">{t('home.cta.title')}</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto relative z-10">
                {t('home.cta.subtitle')}
              </p>

              <Button size="lg" onClick={handleListProperty} className="min-w-[200px] shadow-xl relative z-10">
                {user ? t('common.create') : t('home.hero.getStarted')}
              </Button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
