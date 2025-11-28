import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProperty, type Property, togglePropertyLike, trackPropertyView } from '@/api/properties';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Bed, Bath, Square, Mail, Phone, ArrowLeft, MessageSquare, Heart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RateAgentDialog } from '@/components/agent/RateAgentDialog';
import { Star } from 'lucide-react';
import { BookVisitDialog } from '@/components/properties/BookVisitDialog';
import { formatTZS } from '@/lib/currency';

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProperty() {
      if (!id) return;
      try {
        const data = await fetchProperty(id);
        setProperty(data);
        setIsLiked(data.is_liked);
        setLikeCount(data.like_count);

        // Track view
        await trackPropertyView(id);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load property details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [id, toast]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to like properties',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await togglePropertyLike(id!);
      setIsLiked(result.liked);
      setLikeCount(result.like_count);
      toast({
        title: result.liked ? 'Property Liked' : 'Property Unliked',
        description: result.message,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  };

  const handleMessageAgent = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to message agents',
        variant: 'destructive',
      });
      return;
    }
    // Navigate to agent messages page
    navigate('/agent/messages', { state: { recipientId: property?.agent.id, propertyId: property?.id } });
  };

  const nextImage = () => {
    if (property?.media && property.media.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.media.length);
    }
  };

  const prevImage = () => {
    if (property?.media && property.media.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.media.length) % property.media.length);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Property not found</p>
      </div>
    );
  }

  const currentMedia = property.media?.[currentImageIndex];
  const isVideo = currentMedia?.videos;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image/Video Gallery */}
            <div className="space-y-4">
              {/* Main Image/Video */}
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted relative group">
                {isVideo ? (
                  <video
                    src={currentMedia.videos}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={currentMedia?.Images || '/placeholder.svg'}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                )}

                {/* Navigation Arrows */}
                {property.media && property.media.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {property.media?.length || 0}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {property.media && property.media.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {property.media.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                      {item.videos ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <span className="text-white text-xs">Video</span>
                        </div>
                      ) : (
                        <img
                          src={item.Images}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>{property.city}, {property.address}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {property.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="text-4xl font-bold text-primary mb-6">
                  {formatTZS(property.price)}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={handleLike}
                    variant={isLiked ? "default" : "outline"}
                    className="flex-1"
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Liked' : 'Like'} ({likeCount})
                  </Button>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{property.view_count} views</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-semibold">{property.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-semibold">{property.bathrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Area</p>
                      <p className="font-semibold">{property.area || 'N/A'} sq ft</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-semibold">{property.type}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {property.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Contact Agent</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {property.agent.profile_picture ? (
                      <img
                        src={property.agent.profile_picture}
                        className="w-16 h-16 rounded-full object-cover"
                        alt={`${property.agent.first_name} ${property.agent.last_name}`}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {property.agent.first_name?.charAt(0) || 'A'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p
                        className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/agents/${property.agent.id}/profile`)}
                      >
                        {property.agent.first_name} {property.agent.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{property.agent.email}</p>
                      {property.agent.phone_number && (
                        <p className="text-sm text-gray-600">{property.agent.phone_number}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <a href={`mailto:${property.agent.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Mail className="h-4 w-4" />
                      {property.agent.email}
                    </a>
                    {property.agent.phone_number && (
                      <a href={`tel:${property.agent.phone_number}`} className="flex items-center gap-2 text-sm hover:text-primary">
                        <Phone className="h-4 w-4" />
                        {property.agent.phone_number}
                      </a>
                    )}
                  </div>

                  <div className="space-y-2 pt-4">
                    <Button onClick={handleMessageAgent} className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message Agent
                    </Button>
                    <BookVisitDialog
                      propertyId={Number(property.id)}
                      propertyTitle={property.title}
                      trigger={<Button variant="outline" className="w-full">Schedule Visit</Button>}
                    />
                    {user && (
                      <RateAgentDialog
                        agentId={Number(property.agent.id)}
                        agentName={`${property.agent.first_name} ${property.agent.last_name}`}
                        propertyId={Number(property.id)}
                        trigger={
                          <Button variant="outline" className="w-full">
                            <Star className="mr-2 h-4 w-4" />
                            Rate Agent
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
