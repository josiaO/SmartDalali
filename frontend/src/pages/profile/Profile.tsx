import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, User, Lock, Trash2, Upload } from 'lucide-react';
import { updateProfile, changePassword, deleteAccount } from '@/api/auth';

export default function Profile() {
    const { t } = useTranslation();
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Profile Form
    const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone_number: user?.profile?.phone_number || '',
            address: user?.profile?.address || '',
        }
    });

    // Password Form
    const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm();

    const onUpdateProfile = async (data: any) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('user', JSON.stringify({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
            }));
            formData.append('profile', JSON.stringify({
                phone_number: data.phone_number,
                address: data.address,
            }));

            // Handle image upload if present (need to add file input ref)
            const fileInput = document.getElementById('profile-image') as HTMLInputElement;
            if (fileInput?.files?.[0]) {
                formData.append('profile.image', fileInput.files[0]);
            }

            await updateProfile(formData);
            await refreshUser(); // Refresh user context
            toast.success(t('profile.update_success'));
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('profile.update_error'));
        } finally {
            setLoading(false);
        }
    };

    const onChangePassword = async (data: any) => {
        if (data.new_password !== data.confirm_password) {
            toast.error(t('auth.passwords_do_not_match'));
            return;
        }
        setLoading(true);
        try {
            await changePassword(data.old_password, data.new_password, data.confirm_password);
            toast.success(t('profile.password_success'));
            resetPassword();
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('profile.password_error'));
        } finally {
            setLoading(false);
        }
    };

    const onDeleteAccount = async () => {
        if (!window.confirm(t('profile.delete_confirm'))) return;

        setLoading(true);
        try {
            await deleteAccount();
            toast.success(t('profile.delete_success'));
            logout();
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('profile.delete_error'));
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">{t('profile.title')}</h1>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general" className="gap-2">
                        <User className="h-4 w-4" />
                        {t('profile.general')}
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Lock className="h-4 w-4" />
                        {t('profile.security')}
                    </TabsTrigger>
                    <TabsTrigger value="danger" className="gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        {t('profile.danger_zone')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile.personal_info')}</CardTitle>
                            <CardDescription>{t('profile.personal_info_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={user?.profile?.image} />
                                        <AvatarFallback>{user?.first_name?.[0]}{user?.last_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="profile-image">{t('profile.profile_picture')}</Label>
                                        <Input id="profile-image" type="file" accept="image/*" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">{t('auth.first_name')}</Label>
                                        <Input id="first_name" {...registerProfile('first_name')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">{t('auth.last_name')}</Label>
                                        <Input id="last_name" {...registerProfile('last_name')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('auth.email')}</Label>
                                        <Input id="email" type="email" {...registerProfile('email')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone_number">{t('auth.phone')}</Label>
                                        <Input id="phone_number" {...registerProfile('phone_number')} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">{t('common.address')}</Label>
                                        <Input id="address" {...registerProfile('address')} />
                                    </div>
                                </div>

                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('common.save_changes')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile.change_password')}</CardTitle>
                            <CardDescription>{t('profile.change_password_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="old_password">{t('profile.current_password')}</Label>
                                    <Input id="old_password" type="password" {...registerPassword('old_password', { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new_password">{t('profile.new_password')}</Label>
                                    <Input id="new_password" type="password" {...registerPassword('new_password', { required: true, minLength: 8 })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm_password">{t('profile.confirm_password')}</Label>
                                    <Input id="confirm_password" type="password" {...registerPassword('confirm_password', { required: true })} />
                                </div>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('profile.update_password')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="danger">
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">{t('profile.delete_account')}</CardTitle>
                            <CardDescription>{t('profile.delete_account_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('profile.delete_warning')}
                            </p>
                            <Button variant="destructive" onClick={onDeleteAccount} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('profile.delete_account_button')}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
