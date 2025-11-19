import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Edit, Check, X } from "lucide-react";
import agentService, { AgentProfileData } from "@/services/agent";
import { useToast } from "@/hooks/use-toast";

export function AgentProfile() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<AgentProfileData | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    profile_name: "",
    agency_name: "",
    agency_phone: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await agentService.getProfile();
      setProfileData(response.data);
      const profile = response.data.profile || {};
      const nestedUser = response.data.user || response.data;
      setFormData({
        first_name: nestedUser?.first_name || "",
        last_name: nestedUser?.last_name || "",
        email: nestedUser?.email || "",
        phone_number: profile?.phone_number || "",
        address: profile?.address || "",
        profile_name: profile?.name || "",
        agency_name: response.data.agent_profile?.agency_name || "",
        agency_phone: response.data.agent_profile?.phone || "",
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!profileData) return;

      // Create minimal update objects with only required fields
      const updateData: {
        user: {
          id: number;
          username: string;
          email: string;
          first_name: string;
          last_name: string;
        };
        profile: {
          name: string;
          phone_number: string;
          address: string;
        };
        agent_profile?: {
          id: number;
          agency_name: string;
          phone: string;
        };
      } = {
        user: {
          id: profileData.user.id,
          username: profileData.user.username,
          email: profileData.user.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
        profile: {
          name: formData.profile_name,
          phone_number: formData.phone_number,
          address: formData.address,
        },
      };

      if (profileData.agent_profile) {
        updateData.agent_profile = {
          id: profileData.agent_profile.id,
          agency_name: formData.agency_name,
          phone: formData.agency_phone,
        };
      }

      // Update user and profile data
      await agentService.updateProfile(updateData);

      // Upload image if selected
      if (profileImage) {
        await agentService.updateProfileImage(profileImage);
        setProfileImage(null);
      }

      toast({ title: "Success", description: "Profile updated successfully" });
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="md:ml-64 p-4 md:p-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="md:ml-64 p-4 md:p-8 space-y-6 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Profile Header */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Agent Profile</CardTitle>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileData?.profile?.image || undefined} />
              <AvatarFallback>
                {(() => {
                  const nameSource = formData.profile_name?.trim()
                    ? formData.profile_name
                    : `${formData.first_name} ${formData.last_name}`.trim();
                  return nameSource
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "AG";
                })()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-image">Change Profile Picture</Label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                  className="block text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                    file:text-sm file:font-semibold file:bg-primary/10 file:text-primary
                    hover:file:bg-primary/20"
                />
              </div>
            )}
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">First Name</Label>
              {isEditing ? (
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="text-lg font-medium mt-2">{formData.first_name}</p>
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Last Name</Label>
              {isEditing ? (
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="text-lg font-medium mt-2">{formData.last_name}</p>
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="text-lg font-medium mt-2">{formData.email}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Phone Number</Label>
              {isEditing ? (
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="text-lg font-medium mt-2">{formData.phone_number || "Not set"}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm text-muted-foreground">Address</Label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="text-lg font-medium mt-2">{formData.address || "Not set"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agency Information */}
      <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Agency Information</span>
            <Badge variant={profileData?.agent_profile?.verified ? "default" : "secondary"}>
              {profileData?.agent_profile?.verified ? "✓ Verified" : "Pending Verification"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Agency Name</Label>
              {isEditing ? (
                <Input
                  value={formData.agency_name}
                  onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="text-lg font-medium mt-2">{formData.agency_name}</p>
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Agency Phone</Label>
              {isEditing ? (
                <Input
                  value={formData.agency_phone}
                  onChange={(e) => setFormData({ ...formData, agency_phone: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="text-lg font-medium mt-2">{formData.agency_phone}</p>
              )}
            </div>
          </div>

          {/* Subscription Status */}
          <div className="p-4 rounded-lg bg-background border border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Subscription Status</Label>
                <Badge
                  className="mt-2"
                  variant={profileData?.agent_profile?.subscription_active ? "default" : "secondary"}
                >
                  {profileData?.agent_profile?.subscription_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {profileData?.agent_profile?.subscription_expires && (
                <div>
                  <Label className="text-sm text-muted-foreground">Expires</Label>
                  <p className="text-lg font-medium mt-2">
                    {profileData?.agent_profile?.subscription_expires
                      ? new Date(profileData.agent_profile.subscription_expires).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              fetchProfile();
            }}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} className="gap-2">
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
