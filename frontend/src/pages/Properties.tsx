import { useState, useEffect } from "react";
import propertiesService from "@/services/properties";
import { Property } from "@/data/properties";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Grid3X3,
  List,
  MapPin,
  Building2,
  DollarSign,
  Home,
  Bed,
  Sliders,
  X,
} from "lucide-react";

interface Filters {
  searchQuery: string;
  propertyType: string | null;
  minPrice: string;
  maxPrice: string;
  bedrooms: string | null;
  sortBy: "newest" | "price-low" | "price-high" | "popular";
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<Filters>({
    searchQuery: "",
    propertyType: null,
    minPrice: "",
    maxPrice: "",
    bedrooms: null,
    sortBy: "newest",
  });

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertiesService.fetchListings();
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results;
        setProperties(list || []);
      } catch (err) {
        setError("Failed to fetch properties.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...properties];

    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query) ||
          p.address?.toLowerCase().includes(query)
      );
    }

    // Property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(
        (p) => p.property_type?.toLowerCase() === filters.propertyType?.toLowerCase()
      );
    }

    // Price range filter
    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      filtered = filtered.filter((p) => p.price >= min);
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      filtered = filtered.filter((p) => p.price <= max);
    }

    // Bedrooms filter
    if (filters.bedrooms) {
      const beds = parseInt(filters.bedrooms);
      filtered = filtered.filter((p) => p.bedrooms >= beds);
    }

    // Sorting
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case "newest":
      default:
        filtered.sort((a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
    }

    setFilteredProperties(filtered);
  }, [filters, properties]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      propertyType: null,
      minPrice: "",
      maxPrice: "",
      bedrooms: null,
      sortBy: "newest",
    });
  };

  const isFilterActive = !!(
    filters.searchQuery ||
    filters.propertyType ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.bedrooms ||
    filters.sortBy !== "newest"
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Discover Properties
            </h1>
            <p className="text-lg text-muted-foreground">
              Find your perfect home from our extensive collection
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <Card className="glass-effect">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sliders className="w-4 h-4" />
                      Filters
                    </CardTitle>
                    {isFilterActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-6 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Location, title..."
                        value={filters.searchQuery}
                        onChange={(e) => updateFilter("searchQuery", e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                      value={filters.propertyType || "all"}
                      onValueChange={(value) =>
                        updateFilter("propertyType", value === "all" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Price Range
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Min price"
                        value={filters.minPrice}
                        onChange={(e) => updateFilter("minPrice", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max price"
                        value={filters.maxPrice}
                        onChange={(e) => updateFilter("maxPrice", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Bed className="w-4 h-4" />
                      Min. Bedrooms
                    </label>
                    <Select
                      value={filters.bedrooms || "any"}
                      onValueChange={(value) =>
                        updateFilter("bedrooms", value === "any" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: any) => updateFilter("sortBy", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Mobile Filter Toggle & Controls */}
            <div className="lg:hidden space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 flex-1"
                >
                  <Sliders className="w-4 h-4" />
                  Filters
                  {isFilterActive && (
                    <span className="ml-auto bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs">
                      Active
                    </span>
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile Filters Panel */}
              {showFilters && (
                <Card className="glass-effect">
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Search</label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Location, title..."
                          value={filters.searchQuery}
                          onChange={(e) => updateFilter("searchQuery", e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Type</label>
                      <Select
                        value={filters.propertyType || "all"}
                        onValueChange={(value) =>
                          updateFilter("propertyType", value === "all" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      {isFilterActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="flex-1"
                        >
                          Clear Filters
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowFilters(false)}
                        className="flex-1"
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Desktop View Controls */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filteredProperties.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {properties.length}
                </span>{" "}
                properties
              </p>
            </div>

            {/* Results */}
            {loading && (
              <div
                className={`grid ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 gap-6"
                    : "space-y-4"
                }`}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-red-600 font-semibold mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading && !error && filteredProperties.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                  <p className="text-muted-foreground mb-6">
                    {filters.searchQuery
                      ? "Try adjusting your search"
                      : "No properties available"}
                  </p>
                  {isFilterActive && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {!loading && !error && filteredProperties.length > 0 && (
              <div
                className={`grid ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 gap-6"
                    : "space-y-4"
                }`}
              >
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}