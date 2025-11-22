import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '@/layouts/UserLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupport } from '@/hooks/useSupport';
import { useUI } from '@/contexts/UIContext';
import { ArrowLeft } from 'lucide-react';

const PRIORITIES = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

export function CreateTicket() {
    const navigate = useNavigate();
    const { createTicket, isCreating } = useSupport();
    const { showSuccess, showError } = useUI();

    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'medium',
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createTicket({
                subject: formData.subject,
                description: formData.description,
                priority: formData.priority as 'low' | 'medium' | 'high',
            });

            showSuccess('Support ticket created successfully!');
            navigate('/support');
        } catch (error: any) {
            showError(error.message || 'Failed to create ticket');
        }
    };

    return (
        <UserLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Create Support Ticket</h1>
                        <p className="text-muted-foreground">Describe your issue and we'll help you</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Details</CardTitle>
                            <CardDescription>Provide clear information to help us assist you better</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="subject">Subject *</Label>
                                <Input
                                    id="subject"
                                    value={formData.subject}
                                    onChange={(e) => handleChange('subject', e.target.value)}
                                    placeholder="e.g., Issue with property listing"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="priority">Priority *</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => handleChange('priority', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORITIES.map((priority) => (
                                            <SelectItem key={priority.value} value={priority.value}>
                                                {priority.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Describe your issue in detail..."
                                    rows={8}
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="submit" disabled={isCreating} className="flex-1">
                                    {isCreating ? 'Creating...' : 'Create Ticket'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/support')}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </UserLayout>
    );
}
