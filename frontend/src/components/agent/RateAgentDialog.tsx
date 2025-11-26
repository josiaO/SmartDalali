import { useState, FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAgentRating } from '@/api/admin';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { ApiError } from '@/api/support';

interface RateAgentDialogProps {
    agentId: number;
    agentName: string;
    propertyId?: number;
    propertyTitle?: string;
    trigger?: React.ReactNode;
}

export function RateAgentDialog({ agentId, agentName, propertyId, propertyTitle, trigger }: RateAgentDialogProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: { agent: number; rating: number; review?: string; property?: number }) =>
            createAgentRating(data),
        onSuccess: () => {
            toast.success('Rating submitted successfully');
            queryClient.invalidateQueries({ queryKey: ['agent-ratings'] });
            setOpen(false);
            setReview('');
            setRating(5);
        },
        onError: (error: ApiError) => {
            toast.error(error.response?.data?.error || 'Failed to submit rating');
        },
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const data: { agent: number; rating: number; review?: string; property?: number } = { agent: agentId, rating };
        if (review) data.review = review;
        if (propertyId) data.property = propertyId;
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Rate Agent</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rate {agentName}</DialogTitle>
                    <DialogDescription>
                        Share your experience with this agent{propertyTitle ? ` regarding ${propertyTitle}` : ''}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <Select value={rating.toString()} onValueChange={(v) => setRating(Number(v))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <SelectItem key={val} value={val.toString()}>
                                        <div className="flex items-center">
                                            <span className="mr-2">{val}</span>
                                            <div className="flex">
                                                {Array.from({ length: val }).map((_, i) => (
                                                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="review">Review (Optional)</Label>
                        <Textarea
                            id="review"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Write about your experience..."
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Submitting...' : 'Submit Rating'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
