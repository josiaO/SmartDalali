import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useProperty, useUpdateProperty, useGeocodeAddress } from '@/hooks/useProperties';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, Upload, X, MapPin, Loader2, Video } from 'lucide-react';
import { PROPERTY_TYPES, PROPERTY_STATUS } from '@/lib/constants';
import { SubscriptionGuard } from '@/components/common/SubscriptionGuard';
import { MediaUpload } from '@/components/common/MediaUpload';
import { FEATURES } from '@/lib/permissions';
import { useTranslation } from 'react-i18next';


export default function EditProperty() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: property, isLoading } = useProperty(id!);
  const updateProperty = useUpdateProperty(id!);
  const geocodeAddress = useGeocodeAddress();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    address: '',
    bedrooms: '1',
    bathrooms: '1',
    rooms: '1',
    area: '',
    type: '',
    status: 'for_sale' as string,
    latitude: '',
    longitude: '',
    parking: false,
    year_built: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description,
        price: property.price.toString(),
        city: property.city,
        address: property.address,
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        rooms: property.rooms?.toString() || '1',
        area: property.area?.toString() || '',
        type: property.type || '',
        status: property.status || 'for_sale',
        latitude: property.latitude?.toString() || '',
        longitude: property.longitude?.toString() || '',
        parking: property.parking || false,
        year_built: property.year_built ? property.year_built.split('T')[0] : '',
      });

      // Set existing media
      if (property.media) {
        const imgs = property.media.filter((m: any) => m.Images).map((m: any) => m.Images);
        const vids = property.media.filter((m: any) => m.videos).map((m: any) => m.videos!);
        setExistingImages(imgs);
        setExistingVideos(vids);
      }
    }
  }, [property]);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      videoPreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviews, videoPreviews]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + images.length + files.length;

    if (totalImages > 10) {
      toast({
        title: t('common.error'),
        description: t('form.max_files', { count: 10 }),
        variant: 'destructive',
      });
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Use URL.createObjectURL for better performance and memory management
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalVideos = existingVideos.length + videos.length + files.length;

    if (totalVideos > 2) {
      toast({
        title: t('common.error'),
        description: t('form.max_files', { count: 2 }),
        variant: 'destructive',
      });
      return;
    }

    setVideos(prev => [...prev, ...files]);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setVideoPreviews(prev => [...prev, url]);
    });
  }

  function removeImage(index: number) {
    // Revoke object URL to free memory
    const preview = imagePreviews[index];
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  function removeVideo(index: number) {
    // Revoke object URL to free memory
    const preview = videoPreviews[index];
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(index: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }

  function removeExistingVideo(index: number) {
    setExistingVideos(prev => prev.filter((_, i) => i !== index));
  }

  async function handleGeocode() {
    if (!formData.address || !formData.city) {
      toast({
        title: t('common.error'),
        description: t('form.fill_city_address'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const fullAddress = `${formData.address}, ${formData.city}`;
      const result = await geocodeAddress.mutateAsync(fullAddress);

      if (result.lat && result.lng) {
        setFormData(prev => ({
          ...prev,
          latitude: result.lat.toString(),
          longitude: result.lng.toString(),
        }));
        toast({
          title: t('common.success'),
          description: t('notifications.location_updated'),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('notifications.error_occurred'),
        variant: 'destructive',
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = new FormData();

    // Append all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'parking') {
          data.append(key, value ? 'true' : 'false');
        } else {
          data.append(key, value.toString());
        }
      }
    });

    // Append new images
    images.forEach((image) => {
      data.append('images', image);
    });

    // Append new videos
    videos.forEach((video) => {
      data.append('videos', video);
    });

    try {
      await updateProperty.mutateAsync(data);
      toast({
        title: t('common.success'),
        description: t('notifications.property_updated'),
      });
      navigate(`/properties/${id}`);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('notifications.error_occurred'),
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <SubscriptionGuard feature={FEATURES.EDIT_PROPERTY}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t('properties.edit_property')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('properties.basic_info')}</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">{t('form.title')}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('properties.type')}</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.select_type')} />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{t('properties.status')}</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.select_status')} />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_STATUS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">{t('properties.price')} (TZS)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('form.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('properties.location')}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('properties.city')}</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t('properties.address')}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeocode}
                  disabled={geocodeAddress.isPending}
                >
                  {geocodeAddress.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      {t('properties.auto_locate_coordinates')}
                    </>
                  )}
                </Button>

                {formData.latitude && formData.longitude && (
                  <p className="text-sm text-muted-foreground">
                    Coordinates: {formData.latitude}, {formData.longitude}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('properties.details')}</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">{t('properties.bedrooms')}</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">{t('properties.bathrooms')}</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rooms">{t('properties.total_rooms')}</Label>
                    <Input
                      id="rooms"
                      type="number"
                      min="0"
                      value={formData.rooms}
                      onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">{t('properties.area')} (sq ft)</Label>
                    <Input
                      id="area"
                      type="number"
                      min="0"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year_built">{t('properties.year_built')}</Label>
                    <Input
                      id="year_built"
                      type="date"
                      value={formData.year_built}
                      onChange={(e) => setFormData({ ...formData, year_built: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="parking"
                      checked={formData.parking}
                      onCheckedChange={(checked) => setFormData({ ...formData, parking: checked as boolean })}
                    />
                    <Label htmlFor="parking" className="cursor-pointer">
                      {t('properties.has_parking')}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('properties.media')}</h3>

                <div className="space-y-2">
                  <Label>{t('properties.images')}</Label>
                  <MediaUpload
                    type="image"
                    files={images}
                    previews={imagePreviews}
                    maxFiles={10}
                    onFilesChange={setImages}
                    onPreviewsChange={setImagePreviews}
                    onRemove={removeImage}
                    existingMedia={existingImages}
                    onRemoveExisting={removeExistingImage}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('properties.videos')}</Label>
                  <MediaUpload
                    type="video"
                    files={videos}
                    previews={videoPreviews}
                    maxFiles={2}
                    onFilesChange={setVideos}
                    onPreviewsChange={setVideoPreviews}
                    onRemove={removeVideo}
                    existingMedia={existingVideos}
                    onRemoveExisting={removeExistingVideo}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={updateProperty.isPending}>
                  {updateProperty.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.save')}...
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SubscriptionGuard>
  );
}
