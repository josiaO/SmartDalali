import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, Upload, CheckCircle, Shield } from 'lucide-react';
import api from '@/lib/axios';

export default function AgentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: user?.username || '',
    email: user?.email || '',
    phone: '',
    address: '',
    bio: '',
    agency_name: '',
    agency_phone: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = new FormData();

      // Append profile data
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          data.append(key, value);
        }
      });

      // Append profile image if selected
      if (profileImage) {
        data.append('profile_picture', profileImage);
      }

      await api.patch('/api/v1/accounts/me/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      setIsEditing(false);
      setProfileImage(null);
      setImagePreview(null);

      // Refresh page to get updated data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileImage(null);
    setImagePreview(null);
    setFormData({
      full_name: user?.username || '',
      email: user?.email || '',
      phone: '',
      address: '',
      bio: '',
      agency_name: '',
      agency_phone: '',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Agent Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal and agency information
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imagePreview || undefined} />
                <AvatarFallback className="text-xl">
                  {user?.username?.charAt(0) || user?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {user?.username || user?.email}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Agent
                  </Badge>
                  {user?.agent_profile?.subscription_active && (
                    <Badge variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active Subscription
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="profile_picture">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={imagePreview || undefined} />
                    <AvatarFallback className="text-2xl">
                      {formData.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Input
                      id="profile_picture"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="profile_picture"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: Square image, at least 400x400px
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+255 XXX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street address, City, Region"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your experience..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Agency Information</CardTitle>
            <CardDescription>
              Your agency details displayed to potential clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency_name">Agency Name</Label>
                <Input
                  id="agency_name"
                  placeholder="e.g., Prime Properties Ltd"
                  value={formData.agency_name}
                  onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency_phone">Agency Phone</Label>
                <Input
                  id="agency_phone"
                  type="tel"
                  placeholder="+255 XXX XXX XXX"
                  value={formData.agency_phone}
                  onChange={(e) => setFormData({ ...formData, agency_phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
