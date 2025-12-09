import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { createSupportTicket, CreateTicketData } from '@/api/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormInputField, FormSelectField, FormTextareaField } from '@/components/common/FormFields';
import { FileUpload } from '@/components/common/FileUpload';
import { Form } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';

const ticketSchema = z.object({
    subject: z.string().min(5, "Subject must be at least 5 characters").max(100, "Subject must be less than 100 characters"),
    category: z.string().min(1, "Please select a category"),
    priority: z.string().min(1, "Please select a priority"),
    description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description too long"),
    attachments: z.array(z.instanceof(File)).optional().default([])
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function CreateTicket() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<TicketFormValues>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            subject: '',
            category: '',
            priority: 'low',
            description: '',
            attachments: []
        },
        mode: 'onChange' // Enable live validation
    });

    const createTicketMutation = useMutation({
        mutationFn: (data: TicketFormValues) => {
            // Transform form data to match API expectation if needed
            // The API likely expects the same structure as CreateTicketData
            return createSupportTicket(data as CreateTicketData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            toast({
                title: t('common.success'),
                description: t('notifications.ticket_created'),
            });
            navigate('/support');
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.error || t('notifications.ticket_create_failed'),
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (data: TicketFormValues) => {
        createTicketMutation.mutate(data);
    };

    const categories = [
        { label: t('support.categories.account'), value: 'account' },
        { label: t('support.categories.property'), value: 'property' },
        { label: t('support.categories.payment'), value: 'payment' },
        { label: t('support.categories.technical'), value: 'technical' },
        { label: t('support.categories.report'), value: 'report' },
        { label: t('support.categories.feature'), value: 'feature' },
        { label: t('support.categories.other'), value: 'other' }
    ];

    const priorities = [
        { label: t('support.priority_levels.low'), value: 'low' },
        { label: t('support.priority_levels.medium'), value: 'medium' },
        { label: t('support.priority_levels.high'), value: 'high' },
        { label: t('support.priority_levels.urgent'), value: 'urgent' }
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
            </Button>

            <Card className="border-t-4 border-t-primary shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">{t('support.create_ticket')}</CardTitle>
                    <CardDescription>{t('support.create_ticket_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormInputField
                                name="subject"
                                label={t('support.subject')}
                                placeholder={t('support.subject_placeholder')} // e.g., "Cannot access my dashboard"
                                description="Briefly summarize your issue."
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelectField
                                    name="category"
                                    label={t('support.category')}
                                    placeholder={t('support.select_category')}
                                    options={categories}
                                />

                                <FormSelectField
                                    name="priority"
                                    label={t('support.priority')}
                                    placeholder={t('support.select_priority')}
                                    options={priorities}
                                />
                            </div>

                            <FormTextareaField
                                name="description"
                                label={t('support.description')}
                                placeholder={t('support.description_placeholder')}
                                rows={6}
                                description="Please include as much detail as possible to help us assist you faster."
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {t('support.attachments')}
                                </label>
                                <FileUpload
                                    onFilesSelected={(files) => form.setValue('attachments', files, { shouldValidate: true })}
                                    maxFiles={3}
                                    maxSizeMB={5}
                                    acceptedTypes={['image/*', 'application/pdf']}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!form.formState.isValid || createTicketMutation.isPending}
                                    className="min-w-[120px]"
                                >
                                    {createTicketMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('common.submitting')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            {t('common.submit')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
