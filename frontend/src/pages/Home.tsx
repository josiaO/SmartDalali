import { useState, useEffect } from "react";
import { Search, TrendingUp, Shield, Zap, MapPin, Users, Home as HomeIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import propertiesService from "@/services/properties";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Property } from "@/data/properties";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const response = await propertiesService.fetchListings({ is_published: true });
        const allProps: Property[] = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setAllProperties(allProps);
        const featured = allProps
          .filter((p) => p.featured_until && new Date(p.featured_until) > new Date())
          .slice(0, 3);
        setFeaturedProperties(featured.length > 0 ? featured : allProps.slice(0, 3));
      } catch (err) {
        setError("Failed to fetch featured properties.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-accent/10 py-20 md:py-40">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <TrendingUp className="w-4 h-4" />
              <span>Tanzania's #1 Real Estate Platform</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 max-w-4xl mx-auto leading-tight">
            Find Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dream Property</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Discover verified properties, connect with trusted agents, and make your real estate dreams a reality.
          </p>

          <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              <form className="relative group" onSubmit={(e) => { e.preventDefault(); if (searchQuery) navigate(`/properties?q=${searchQuery}`); }}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by location, property type..."
                  className="w-full h-14 pl-12 pr-4 text-base rounded-full bg-card border border-input shadow-lg
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                             transition-all duration-300 placeholder:text-muted-foreground"
                />
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Properties</p>
                    <p className="text-3xl font-bold">{allProperties.length.toLocaleString()}+</p>
                  </div>
                  <HomeIcon className="w-12 h-12 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Verified Agents</p>
                    <p className="text-3xl font-bold">1000+</p>
                  </div>
                  <Users className="w-12 h-12 text-green-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Regions Covered</p>
                    <p className="text-3xl font-bold">15+</p>
                  </div>
                  <MapPin className="w-12 h-12 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SmartDalali?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-all">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Listings</h3>
              <p className="text-muted-foreground">
                All properties are verified by our team for authenticity and reliability
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/10 hover:border-accent/30 transition-all">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Response</h3>
              <p className="text-muted-foreground">
                Connect with agents instantly via phone, WhatsApp, or in-app messaging
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/10 hover:border-green-500/30 transition-all">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Market Insights</h3>
              <p className="text-muted-foreground">
                Stay updated with the latest property market trends and pricing data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Featured Properties</h2>
              <p className="text-muted-foreground">Handpicked premium listings for you</p>
            </div>
            <Link to="/properties">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Find Your Dream Property?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their perfect property with SmartDalali
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/properties">
              <Button size="lg" className="gap-2 px-8">
                <Search className="w-4 h-4" />
                Browse Properties
              </Button>
            </Link>
            <Link to={user ? "/properties/new" : "/login"}>
              <Button size="lg" variant="outline" className="gap-2 px-8">
                <HomeIcon className="w-4 h-4" />
                {user ? "List Your Property" : "Get Started"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
