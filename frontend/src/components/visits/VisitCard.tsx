
import React from 'react';
import { Visit, updateVisitStatus, deleteVisit } from '@/api/visits';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Check, X, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VisitCardProps {
    visit: Visit;
    role: 'agent' | 'user';
    onUpdate: () => void;
}

export function VisitCard({ visit, role, onUpdate }: VisitCardProps) {
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            setLoading(true);
            await updateVisitStatus(visit.id, newStatus);
            toast({
                title: 'Success',
                description: `Visit ${newStatus} successfully`,
            });
            onUpdate();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update visit status',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const statusColor = {
        pending: 'bg-yellow-500',
        confirmed: 'bg-green-500',
        completed: 'bg-blue-500',
        cancelled: 'bg-red-500',
    }[visit.status];

    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1">
                    <CardTitle className="text-l font-bold truncate">
                        {visit.property_details?.title || 'Unknown Property'}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {visit.property_details?.location || visit.property_details?.city}
                    </div>
                </div>
                <Badge className={`${statusColor} text-white capitalize`}>{visit.status}</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 py-4">
                {/* Date and Time */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{format(new Date(visit.date), 'PPP')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{visit.time}</span>
                    </div>
                </div>

                {/* Property Image (Thumbnail) */}
                {visit.property_details?.image && (
                    <div className="relative h-32 w-full overflow-hidden rounded-md mt-2">
                        <img
                            src={visit.property_details.image}
                            alt={visit.property_details.title}
                            className="object-cover w-full h-full"
                        />
                    </div>
                )}

                {/* Participant Details */}
                <div className="flex items-center space-x-4 pt-2">
                    {role === 'agent' ? (
                        <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col text-sm">
                                <span className="font-medium">{visit.user_details?.username}</span>
                                <span className="text-xs text-muted-foreground">Client</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col text-sm">
                                <span className="font-medium">{visit.agent_details?.username}</span>
                                <span className="text-xs text-muted-foreground">{visit.agent_details?.agency_name || 'Agent'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes */}
                {visit.notes && (
                    <div className="bg-muted/50 p-2 rounded-md text-sm italic">
                        "{visit.notes}"
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
                {role === 'agent' && visit.status === 'pending' && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate('declined')}
                            disabled={loading}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            <X className="mr-2 h-4 w-4" /> Decline
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => handleStatusUpdate('confirmed')}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Check className="mr-2 h-4 w-4" /> Accept
                        </Button>
                    </>
                )}

                {role === 'agent' && visit.status === 'confirmed' && (
                    <Button
                        size="sm"
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={loading}
                    >
                        <Check className="mr-2 h-4 w-4" /> Mark Completed
                    </Button>
                )}

                {role === 'user' && (visit.status === 'pending' || visit.status === 'confirmed') && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusUpdate('cancelled')}
                        disabled={loading}
                    >
                        <Ban className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
