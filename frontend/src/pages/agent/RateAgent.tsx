import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAgentRating, fetchAgentRatings } from '@/api/admin';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Star } from 'lucide-react';

export default function RateAgent() {
    const queryClient = useQueryClient();
    const [agentId, setAgentId] = useState('');
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState('');
    const [propertyId, setPropertyId] = useState('');

    // In a real app you would fetch agents and properties to populate selects
    // For simplicity we assume the IDs are known or entered manually.

    const mutation = useMutation({
        mutationFn: (data: { agent: number; rating: number; review?: string; property?: number }) =>
            createAgentRating(data),
        onSuccess: () => {
            toast.success('Rating submitted successfully');
            queryClient.invalidateQueries({ queryKey: ['agent-ratings'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to submit rating');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentId) {
            toast.error('Select an agent');
            return;
        }
        const data: any = { agent: Number(agentId), rating };
        if (review) data.review = review;
        if (propertyId) data.property = Number(propertyId);
        mutation.mutate(data);
    };

    return (
        <Card className="max-w-xl mx-auto mt-8">
            <CardHeader>
                <CardTitle>Rate an Agent</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="agent-id">Agent ID</Label>
                        <Input
                            id="agent-id"
                            type="number"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            placeholder="Enter agent ID"
                            required
                        />
                    </div>
                    <div>
                        <Label>Rating</Label>
                        <Select value={rating.toString()} onValueChange={(v) => setRating(Number(v))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <SelectItem key={val} value={val.toString()}>
                                        <Star className="inline-block h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                        {val}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="review">Review (optional)</Label>
                        <Textarea
                            id="review"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Write a review..."
                        />
                    </div>
                    <div>
                        <Label htmlFor="property-id">Property ID (optional)</Label>
                        <Input
                            id="property-id"
                            type="number"
                            value={propertyId}
                            onChange={(e) => setPropertyId(e.target.value)}
                            placeholder="Enter property ID"
                        />
                    </div>
                    <Button type="submit" disabled={mutation.isPending} className="w-full">
                        {mutation.isPending ? 'Submitting...' : 'Submit Rating'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
