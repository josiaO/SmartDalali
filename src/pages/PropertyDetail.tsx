import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Bed, Bath, Square, Calendar, Eye, Heart, Share2, 
  Phone, Mail, MessageCircle, ChevronLeft, ChevronRight,
  Home, Building2, MapIcon, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockProperties } from "@/data/properties";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const property = mockProperties.find((p) => p.id === Number(id));
  
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Property not found</h2>
          <Button onClick={() => navigate("/properties")}>Back to Properties</Button>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: window.location.href,
      });
    }
  };

  const amenities = [
    "Swimming Pool", "Gym", "Garden", "Parking", "Security", 
    "Elevator", "Balcony", "Air Conditioning"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative h-[500px] rounded-xl overflow-hidden glass-effect">
            <img
              src={property.images[currentImageIndex]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation Buttons */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2"
              onClick={prevImage}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2"
              onClick={nextImage}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-6 gap-2 mt-4">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  currentImageIndex === index 
                    ? 'border-primary scale-105' 
                    : 'border-transparent hover:border-primary/50'
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Price */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{property.location.address}, {property.location.city}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {property.type}
                </Badge>
              </div>
              <div className="text-4xl font-bold text-primary">
                TSh {property.price.toLocaleString()}
                {property.type === "rent" && <span className="text-lg text-muted-foreground">/month</span>}
              </div>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Bed className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Bath className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-info/10">
                      <Square className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{property.area}</div>
                      <div className="text-sm text-muted-foreground">m²</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-success/10">
                      <Eye className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">1.2k</div>
                      <div className="text-sm text-muted-foreground">Views</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Property</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {property.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">SKU</div>
                        <div className="font-medium">PROP-{String(property.id).slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Year Built</div>
                        <div className="font-medium">2020</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Property Type</div>
                        <div className="font-medium capitalize">{property.type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <Badge variant="default">Available</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="features" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Features & Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="location" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapIcon className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <div className="font-medium">Address</div>
                          <div className="text-muted-foreground">
                            {property.location.address}, {property.location.city}
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Map view coming soon</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Card */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Contact Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=agent${property.agentId}`} />
                    <AvatarFallback>AG</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">John Kamau</div>
                    <div className="text-sm text-muted-foreground">Senior Agent</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">(4.9)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full gap-2">
                    <Phone className="w-4 h-4" />
                    Call Agent
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Working Hours</div>
                  <div className="text-sm font-medium">Mon - Fri: 9:00 AM - 6:00 PM</div>
                  <div className="text-sm font-medium">Sat: 10:00 AM - 4:00 PM</div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockProperties
                  .filter((p) => p.id !== property.id && p.type === property.type)
                  .slice(0, 3)
                  .map((similarProperty) => (
                    <button
                      key={similarProperty.id}
                      onClick={() => navigate(`/properties/${similarProperty.id}`)}
                      className="flex gap-3 w-full text-left hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    >
                      <img
                        src={similarProperty.images[0]}
                        alt={similarProperty.title}
                        className="w-20 h-20 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-1 text-sm">
                          {similarProperty.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {similarProperty.location.city}
                        </div>
                        <div className="font-semibold text-sm text-primary mt-1">
                          TSh {similarProperty.price.toLocaleString()}
                        </div>
                      </div>
                    </button>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
