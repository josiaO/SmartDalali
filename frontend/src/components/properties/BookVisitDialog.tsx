import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { scheduleVisit } from '@/api/visits';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BookVisitDialogProps {
    propertyId: number;
    propertyTitle: string;
    trigger?: React.ReactNode;
}

interface VisitFormData {
    scheduled_time: Date;
    notes: string;
}

export function BookVisitDialog({ propertyId, propertyTitle, trigger }: BookVisitDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<VisitFormData>({
        defaultValues: {
            notes: '',
        },
    });

    async function onSubmit(data: VisitFormData) {
        if (!data.scheduled_time) {
            form.setError('scheduled_time', { message: 'Please select a date and time' });
            return;
        }

        setIsLoading(true);
        try {
            // Format date as YYYY-MM-DD
            const dateStr = format(data.scheduled_time, 'yyyy-MM-dd');
            // Format time as HH:MM
            const timeStr = format(data.scheduled_time, 'HH:mm');

            await scheduleVisit({
                property: propertyId,
                date: dateStr,
                time: timeStr,
                notes: data.notes,
            });

            toast({
                title: 'Visit Scheduled',
                description: 'Your visit request has been sent to the agent.',
            });
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Failed to schedule visit. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Book a Visit</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" aria-describedby="book-visit-desc">
                <DialogHeader>
                    <DialogTitle>Book a Visit</DialogTitle>
                    <DialogDescription id="book-visit-desc">
                        Schedule a viewing for {propertyTitle}. The agent will confirm the time.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="scheduled_time"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date()
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any specific questions or preferred time of day?"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Schedule Visit
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
