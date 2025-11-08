import { useState, useMemo } from "react";
import { Building2, SlidersHorizontal, Search, MapPin, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PropertyCard } from "@/components/PropertyCard";
import { mockProperties } from "@/data/properties";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

export default function Properties() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<"all" | "sale" | "rent" | "land">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [bedrooms, setBedrooms] = useState<string>("all");
  const [bathrooms, setBathrooms] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const { t } = useLanguage();

  const filteredProperties = useMemo(() => {
    let filtered = mockProperties;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((p) => p.type === selectedType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.location.city.toLowerCase().includes(query) ||
          p.location.address.toLowerCase().includes(query)
      );
    }

    // Filter by price
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Filter by bedrooms
    if (bedrooms !== "all") {
      filtered = filtered.filter((p) => p.bedrooms >= parseInt(bedrooms));
    }

    // Filter by bathrooms
    if (bathrooms !== "all") {
      filtered = filtered.filter((p) => p.bathrooms >= parseInt(bathrooms));
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        break;
    }

    return filtered;
  }, [selectedType, searchQuery, priceRange, bedrooms, bathrooms, sortBy]);

  const types: Array<{ value: "all" | "sale" | "rent" | "land"; label: string }> = [
    { value: "all", label: t("filter.all") },
    { value: "sale", label: t("filter.sale") },
    { value: "rent", label: t("filter.rent") },
    { value: "land", label: t("filter.land") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-8">
        {/* Browser-like Search Bar */}
        <Card className="p-4 mb-6 glass-effect">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by location, title, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background/50"
              />
            </div>
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 h-12">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                    <SheetDescription>
                      Refine your property search
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-3 block">Price Range (TSh)</label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={100000000}
                        step={1000000}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{priceRange[0].toLocaleString()}</span>
                        <span>{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                      <Select value={bedrooms} onValueChange={setBedrooms}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Bathrooms</label>
                      <Select value={bathrooms} onValueChange={setBathrooms}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Browser Tabs Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 border-b overflow-x-auto">
            {types.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`browser-tab px-6 py-3 font-medium transition-colors ${
                  selectedType === type.value 
                    ? 'active text-primary bg-primary/5' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">
              {selectedType === "all"
                ? "All Properties"
                : types.find((t) => t.value === selectedType)?.label}
            </h2>
            <Badge variant="secondary">{filteredProperties.length} results</Badge>
          </div>
          
          <Button variant="outline" onClick={() => navigate("/map")}>
            <MapPin className="w-4 h-4 mr-2" />
            Map View
          </Button>
        </div>

        {/* Property Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSelectedType("all");
                setSearchQuery("");
                setPriceRange([0, 100000000]);
                setBedrooms("all");
                setBathrooms("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
