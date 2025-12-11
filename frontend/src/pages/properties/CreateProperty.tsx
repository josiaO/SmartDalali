import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createProperty } from '@/api/properties';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useGeocodeAddress } from '@/hooks/useProperties';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, MapPin, Check, Loader2, Video } from 'lucide-react';
import { PROPERTY_TYPES, PROPERTY_STATUS } from '@/lib/constants';
import { SubscriptionGuard } from '@/components/common/SubscriptionGuard';
import { FEATURES } from '@/lib/permissions';
import { Progress } from '@/components/ui/progress';
import { MediaUpload } from '@/components/common/MediaUpload';
import { MiniGuide } from '@/components/common/MiniGuide';
import { useTranslation } from 'react-i18next';


export default function CreateProperty() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const geocodeAddress = useGeocodeAddress();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: '',
    status: 'active',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    bedrooms: '',
    bathrooms: '',
    rooms: '',
    area: '',
    parking: false,
    year_built: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createPropertyMutation = useMutation({
    mutationFn: (data: FormData) => createProperty(data, (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setUploadProgress(percentCompleted);
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: t('common.success'),
        description: t('notifications.property_created'),
      });
      navigate('/agent/my-properties');
    },
    onError: () => {
      setUploadProgress(0);
      toast({
        title: t('common.error'),
        description: t('notifications.error_occurred'),
        variant: 'destructive',
      });
    },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 10) {
        toast({
          title: t('common.error'),
          description: t('form.max_files', { count: 10 }),
          variant: 'destructive',
        });
        return;
      }
      setImages(prev => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (videos.length + newFiles.length > 2) {
        toast({
          title: t('common.error'),
          description: t('form.max_files', { count: 2 }),
          variant: 'destructive',
        });
        return;
      }
      setVideos(prev => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setVideoPreviews(prev => [...prev, ...newPreviews]);
    }
  }

  function removeVideo(index: number) {
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleAutoLocate() {
    if (!formData.address || !formData.city) {
      toast({
        title: t('common.error'),
        description: t('common.required'),
        variant: 'destructive',
      });
      return;
    }
    try {
      const result = await geocodeAddress.mutateAsync(`${formData.address}, ${formData.city}`);
      if (result.lat && result.lng) {
        setFormData(prev => ({
          ...prev,
          latitude: result.lat.toString(),
          longitude: result.lng.toString(),
        }));
        toast({ title: t('common.success'), description: t('notifications.location_updated') });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('notifications.error_occurred'),
        variant: 'destructive',
      });
    }
  }

  async function handleSubmit() {
    if (images.length === 0) {
      toast({
        title: t('common.error'),
        description: t('common.required'),
        variant: 'destructive',
      });
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'status') {
        data.append(key, 'active');
      } else if (key === 'parking') {
        data.append(key, value ? 'true' : 'false');
      } else if (value) {
        data.append(key, value as string);
      }
    });

    images.forEach((image) => {
      data.append(`images`, image);
    });

    videos.forEach((video) => {
      data.append(`videos`, video);
    });

    createPropertyMutation.mutate(data);
  }

  const nextStep = () => {
    if (currentStep === 1 && (!formData.title || !formData.price || !formData.type)) {
      toast({ title: t('common.required'), description: t('form.fill_all_required'), variant: 'destructive' });
      return;
    }
    if (currentStep === 2 && (!formData.city || !formData.address)) {
      toast({ title: t('common.required'), description: t('form.fill_city_address'), variant: 'destructive' });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const STEPS = [
    { id: 1, title: t('properties.basic_info') },
    { id: 2, title: t('properties.location') },
    { id: 3, title: t('properties.details') },
    { id: 4, title: t('properties.media') },
    { id: 5, title: t('common.review') },
  ];

  return (
    <SubscriptionGuard feature={FEATURES.CREATE_PROPERTY}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div key={step.id} className={`text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.id}. {step.title}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 5) * 100} className="h-2" />
        </div>

        {currentStep === 1 && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <MiniGuide
              title={t('common.how_it_works')}
              steps={[
                { title: t('create_property_guide.step1_title'), description: t('create_property_guide.step1_desc') },
                { title: t('create_property_guide.step2_title'), description: t('create_property_guide.step2_desc') },
                { title: t('create_property_guide.step3_title'), description: t('create_property_guide.step3_desc') }
              ]}
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{t('common.step')} {currentStep} {t('common.of')} 5</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('form.title')} *</Label>
                  <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder={t('form.title_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('form.description')} *</Label>
                  <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder={t('form.description_placeholder')} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('properties.type')} *</Label>
                    <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                      <SelectTrigger><SelectValue placeholder={t('form.select_type')} /></SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('properties.status')} *</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PROPERTY_STATUS[0].value}>{t('properties.for_sale')}</SelectItem>
                        <SelectItem value={PROPERTY_STATUS[1].value}>{t('properties.for_rent')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">{t('properties.price')} (TZS) *</Label>
                  <Input id="price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('properties.city')} *</Label>
                    <Input id="city" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder={t('properties.city_placeholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('properties.address')} *</Label>
                    <Input id="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder={t('properties.address_placeholder')} />
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={handleAutoLocate} disabled={geocodeAddress.isPending}>
                  {geocodeAddress.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                  {geocodeAddress.isPending ? t('common.locating') : t('properties.auto_locate_coordinates')}
                </Button>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('properties.latitude')}</Label>
                    <Input value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} placeholder={t('common.optional')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('properties.longitude')}</Label>
                    <Input value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} placeholder={t('common.optional')} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('properties.bedrooms')}</Label>
                    <Input type="number" value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('properties.bathrooms')}</Label>
                    <Input type="number" value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('properties.total_rooms')}</Label>
                    <Input type="number" value={formData.rooms} onChange={e => setFormData({ ...formData, rooms: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('properties.square_feet')}</Label>
                    <Input type="number" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('properties.year_built')}</Label>
                    <Input type="date" value={formData.year_built} onChange={e => setFormData({ ...formData, year_built: e.target.value })} />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox id="parking" checked={formData.parking} onCheckedChange={(checked) => setFormData({ ...formData, parking: checked as boolean })} />
                    <Label htmlFor="parking">{t('properties.has_parking')}</Label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Media */}
            {currentStep === 4 && (
              <div className="space-y-6">
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
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">{formData.title}</h3>
                  <p className="text-sm text-muted-foreground">{formData.description}</p>
                  <div className="grid grid-cols-1 gap-2 text-sm mt-4 md:grid-cols-2">
                    <div><strong>{t('properties.price')}:</strong> {formData.price}</div>
                    <div><strong>{t('properties.type')}:</strong> {formData.type}</div>
                    <div><strong>{t('properties.location')}:</strong> {formData.city}, {formData.address}</div>
                    <div><strong>{t('properties.rooms')}:</strong> {formData.rooms}</div>
                    <div><strong>{t('properties.parking')}:</strong> {formData.parking ? t('common.yes') : t('common.no')}</div>
                    <div><strong>{t('properties.year_built')}:</strong> {formData.year_built}</div>
                    <div><strong>{t('properties.images')}:</strong> {images.length} {t('common.uploaded')}</div>
                    <div><strong>{t('properties.videos')}:</strong> {videos.length} {t('common.uploaded')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded border border-green-200">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">{t('properties.ready_to_publish')}</span>
                </div>

                {createPropertyMutation.isPending && (
                  <div className="space-y-2 pt-4">
                    <div className="flex justify-between text-sm">
                      <span>{t('common.uploading_media')}...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}

          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || createPropertyMutation.isPending}>{t('common.previous')}</Button>
            {currentStep < 5 ? (
              <Button onClick={nextStep}>{t('common.next')}</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createPropertyMutation.isPending}>
                {createPropertyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.publishing')}
                  </>
                ) : t('properties.publish_listing')}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </SubscriptionGuard>
  );
}
