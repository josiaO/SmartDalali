import { useState, useEffect } from "react";
import propertiesService from "@/services/properties";
import { Property } from "@/data/properties";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Grid3X3, List, MapPin, Building2 } from "lucide-react";

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertiesService.fetchListings();
        const list = Array.isArray(response.data) ? response.data : response.data.results;
        setProperties(list || []);
        setFilteredProperties(list || []);
      } catch (err) {
        setError("Failed to fetch properties.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter properties based on search query and type
  useEffect(() => {
    let filtered = properties;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query)
      );
    }

    if (filterType) {
      filtered = filtered.filter((p) => p.property_type?.toLowerCase() === filterType.toLowerCase());
    }

    setFilteredProperties(filtered);
  }, [searchQuery, properties, filterType]);

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

      {/* Search and Filter Bar */}
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by location, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-lg"
              />
            </div>
          </div>

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
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(null)}
          >
            All Properties
          </Button>
          <Button
            variant={filterType === "apartment" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("apartment")}
            className="gap-1"
          >
            <Building2 className="w-3 h-3" />
            Apartments
          </Button>
          <Button
            variant={filterType === "house" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("house")}
            className="gap-1"
          >
            <Building2 className="w-3 h-3" />
            Houses
          </Button>
          <Button
            variant={filterType === "land" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("land")}
            className="gap-1"
          >
            <MapPin className="w-3 h-3" />
            Land
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredProperties.length}</span> of <span className="font-semibold text-foreground">{properties.length}</span> properties
        </p>
        {(searchQuery || filterType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterType(null);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        {loading && (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg bg-card">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 font-semibold mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        )}
        {!loading && !error && filteredProperties.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search" : "No properties available"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
        {!loading && !error && filteredProperties.length > 0 && (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}