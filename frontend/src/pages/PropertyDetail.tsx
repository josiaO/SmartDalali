import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  MapPin, Bed, Bath, Square, Calendar, Eye, Heart, Share2, 
  Phone, Mail, MessageCircle, ChevronLeft, ChevronRight,
  Home, Building2, MapIcon, Star, Loader2, ArrowLeft,
  Check, Zap, Shield, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Property } from "@/data/properties";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import propertiesService from "@/services/properties";
import communicationsService from "@/services/communications";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await propertiesService.fetchListing(id!);
        setProperty(response.data);
      } catch (err) {
        setError("Failed to fetch property details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <Skeleton className="h-96 w-full rounded-xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-64 mb-4" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
            <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/properties")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Properties
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = property.MediaProperty?.map(media => media.Images).filter(Boolean) as string[] || [];
  const mainImageUrl = property.main_image_url || (images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800');

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const handleContactAgent = async (contactType: 'message' | 'call' | 'whatsapp' | 'email') => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!property?.agent?.id) {
      toast({ title: "Error", description: "Agent information not available", variant: "destructive" });
      return;
    }

    try {
      setContactLoading(true);
      
      switch (contactType) {
        case 'message':
          const response = await communicationsService.startConversation({
            user_id: property.agent.id,
            property_id: property.id,
          });
          navigate(`/messages/${response.data.id}`);
          toast({ title: "Success", description: "Chat opened with agent" });
          break;
        case 'call':
          if (property.agent?.phone) {
            window.location.href = `tel:${property.agent.phone}`;
          }
          break;
        case 'whatsapp':
          if (property.agent?.phone) {
            const message = encodeURIComponent(`Hi! I'm interested in ${property.title}`);
            window.open(`https://wa.me/${property.agent.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
          }
          break;
        case 'email':
          if (property.agent?.email) {
            window.location.href = `mailto:${property.agent.email}?subject=Interested in ${property.title}&body=Hi,\\n\\nI am interested in your property: ${property.title}\\n\\nPlease get back to me with more details.\\n\\nThank you!`;
          }
          break;
      }
    } catch (err: any) {
      console.error('Error contacting agent:', err);
      toast({ 
        title: "Error", 
        description: err.response?.data?.detail || "Failed to contact agent",
        variant: "destructive" 
      });
    } finally {
      setContactLoading(false);
    }
  };

  // Use property.Features_Property for amenities
  const amenities = property.Features_Property?.map(feature => feature.features) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-2 mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Image Gallery - Full Width */}
        <div className="mb-8">
          <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-xl">
            <img
              src={images[currentImageIndex] || mainImageUrl}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 shadow-lg hover:scale-110 transition-transform"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 shadow-lg hover:scale-110 transition-transform"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}

            {/* Image Counter & Status Badge */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              {images.length > 0 && (
                <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
              <Badge className="capitalize text-base px-3 py-1">
                {property.status}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="shadow-lg hover:scale-110 transition-transform"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="shadow-lg hover:scale-110 transition-transform"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-4">
              {images.slice(0, 8).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all hover:border-primary/50 ${
                    currentImageIndex === index 
                      ? 'border-primary ring-2 ring-primary/50' 
                      : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold mb-3">{property.title}</h1>
                  <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{property.address}, {property.city}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary mb-1">
                    TSh {property.price.toLocaleString()}
                  </div>
                  {property.status === "rented" && (
                    <Badge variant="outline" className="text-base">per month</Badge>
                  )}
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {property.bedrooms && (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-500/10">
                          <Bed className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold">{property.bedrooms}</div>
                          <div className="text-xs text-muted-foreground">Bedrooms</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {property.bathrooms && (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-green-500/10">
                          <Bath className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold">{property.bathrooms}</div>
                          <div className="text-xs text-muted-foreground">Bathrooms</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {property.area && (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-purple-500/10">
                          <Square className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold">{property.area}</div>
                          <div className="text-xs text-muted-foreground">m²</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-orange-500/10">
                        <Eye className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">{property.view_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted">
                <TabsTrigger value="description" className="text-sm sm:text-base">Description</TabsTrigger>
                <TabsTrigger value="features" className="text-sm sm:text-base">Features</TabsTrigger>
                <TabsTrigger value="details" className="text-sm sm:text-base">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Property</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="features" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Features & Amenities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {amenities.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-3 p-2">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="font-medium">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No features or amenities listed.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Property ID</div>
                        <div className="font-semibold">PROP-{String(property.id).slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Property Type</div>
                        <div className="font-semibold capitalize">{property.property_type || property.type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Year Built</div>
                        <div className="font-semibold">{property.year_built ? new Date(property.year_built).getFullYear() : 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <Badge variant="default" className="capitalize">{property.status}</Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Listed Date</div>
                        <div className="font-semibold">{new Date(property.created_at).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Location</div>
                        <div className="font-semibold">{property.city}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Card - Sticky */}
            <div className="sticky top-4">
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">Agent Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Agent Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20 border-2 border-primary">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${property.agent?.username || property.owner}`} />
                      <AvatarFallback>{property.agent?.name?.charAt(0) || property.agent?.username?.charAt(0) || 'AG'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{property.agent?.name || property.agent?.username || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">Professional Agent</div>
                      {property.agent_profile?.verified && (
                        <div className="flex items-center gap-1 mt-2 bg-green-50 w-fit px-2 py-1 rounded-full">
                          <Shield className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">Verified</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button 
                      className="w-full gap-2 bg-primary hover:bg-primary/90 text-base py-6"
                      onClick={() => handleContactAgent('message')}
                      disabled={contactLoading || !user}
                    >
                      {contactLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      {user ? 'Send Message' : 'Login to Message'}
                    </Button>
                    
                    {property.agent?.phone && (
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 py-6"
                        onClick={() => handleContactAgent('call')}
                        disabled={contactLoading}
                      >
                        <Phone className="w-4 h-4" />
                        Call Agent
                      </Button>
                    )}
                    
                    {property.agent?.phone && (
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 py-6"
                        onClick={() => handleContactAgent('whatsapp')}
                        disabled={contactLoading}
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    )}
                    
                    {property.agent?.email && (
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 py-6"
                        onClick={() => handleContactAgent('email')}
                        disabled={contactLoading}
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </Button>
                    )}
                  </div>

                  {/* Working Hours */}
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Clock className="w-4 h-4 text-primary" />
                      Working Hours
                    </div>
                    <div className="space-y-1 text-sm ml-6">
                      <div><span className="text-muted-foreground">Mon - Fri:</span> <span className="font-medium">9:00 AM - 6:00 PM</span></div>
                      <div><span className="text-muted-foreground">Sat:</span> <span className="font-medium">10:00 AM - 4:00 PM</span></div>
                      <div><span className="text-muted-foreground">Sun:</span> <span className="font-medium">Closed</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Info Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
              <CardHeader>
                <CardTitle className="text-lg">Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Property Views</span>
                  <span className="font-bold text-lg">{property.view_count || 0}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-muted-foreground">Listed Since</span>
                  <span className="font-bold">{new Date(property.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
