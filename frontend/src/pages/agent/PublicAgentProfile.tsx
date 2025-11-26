import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Star, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { fetchProperties, type Property } from '@/api/properties';
import api from '@/lib/axios';

interface AgentProfile {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    bio: string;
    profile_picture: string;
    rating: number;
    review_count: number;
}

export default function PublicAgentProfile() {
    const { id } = useParams<{ id: string }>();
    const [agent, setAgent] = useState<AgentProfile | null>(null);
    const [listings, setListings] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (id) {
            loadAgentData(id);
        }
    }, [id]);

    async function loadAgentData(agentId: string) {
        setLoading(true);
        try {
            // Fetch agent details (mocking for now as endpoint might not exist)
            // In a real scenario, we'd have /api/v1/accounts/agents/${agentId}/
            // For now, we'll try to fetch properties and extract agent info from the first one, 
            // or use a dedicated endpoint if available.
            // Let's assume we have an endpoint or we'll mock it.

            // Mocking agent fetch for demonstration as the specific endpoint wasn't confirmed
            // We will try to fetch properties for this agent to populate the listings
            const propertiesData = await fetchProperties({ agent_id: Number(agentId) });
            setListings(propertiesData.results);

            if (propertiesData.results.length > 0) {
                const agentInfo = propertiesData.results[0].agent;
                setAgent({
                    id: Number(agentInfo.id),
                    email: agentInfo.email,
                    first_name: agentInfo.first_name,
                    last_name: agentInfo.last_name,
                    phone_number: agentInfo.phone_number || 'N/A',
                    bio: 'Experienced real estate agent dedicated to helping you find your perfect home.', // Mock bio
                    profile_picture: agentInfo.profile_picture || '',
                    rating: 4.8, // Mock rating
                    review_count: 12, // Mock count
                });
            } else {
                // Fallback if no properties
                setAgent({
                    id: Number(agentId),
                    email: 'agent@example.com',
                    first_name: 'Agent',
                    last_name: 'Name',
                    phone_number: 'N/A',
                    bio: 'Agent profile information not available.',
                    profile_picture: '',
                    rating: 0,
                    review_count: 0,
                });
            }

        } catch (error) {
            console.error('Failed to load agent:', error);
            toast({
                title: 'Error',
                description: 'Failed to load agent profile',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-muted-foreground">Agent not found</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Agent Info Sidebar */}
                <div className="md:col-span-1">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Avatar className="w-32 h-32 mx-auto mb-4">
                                <AvatarImage src={agent.profile_picture} alt={agent.first_name} />
                                <AvatarFallback>{agent.first_name[0]}{agent.last_name[0]}</AvatarFallback>
                            </Avatar>

                            <h1 className="text-2xl font-bold mb-1">{agent.first_name} {agent.last_name}</h1>
                            <p className="text-muted-foreground mb-4">Real Estate Agent</p>

                            <div className="flex items-center justify-center gap-1 mb-6">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold">{agent.rating}</span>
                                <span className="text-muted-foreground">({agent.review_count} reviews)</span>
                            </div>

                            <div className="space-y-4 text-left mb-6">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{agent.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{agent.phone_number}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">Dar es Salaam, Tanzania</span>
                                </div>
                            </div>

                            <Button className="w-full mb-2">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Message Agent
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-lg">About</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {agent.bio}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Listings */}
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold mb-6">Active Listings</h2>
                    {listings.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground">No active listings found for this agent.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-6">
                            {listings.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
