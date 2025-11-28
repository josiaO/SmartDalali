import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, Building2, MapPin, ArrowLeft, MessageSquare } from 'lucide-react';
import { Property } from '@/api/properties';

interface AgentProfile {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    profile: {
        name: string;
        phone_number: string;
        address: string;
        image: string | null;
    };
    agent_profile: {
        agency_name: string;
        phone: string;
        verified: boolean;
    };
}

interface AgentData {
    agent: AgentProfile;
    properties: Property[];
}

export default function AgentPublicProfile() {
    const { agentId } = useParams<{ agentId: string }>();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery<AgentData>({
        queryKey: ['agent-profile', agentId],
        queryFn: async () => {
            const response = await api.get(`/api/v1/properties/agents/${agentId}/public-profile/`);
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Not Found</h2>
                    <p className="text-gray-600 mb-6">The agent profile you're looking for doesn't exist.</p>
                    <Button onClick={() => navigate('/properties')}>Browse Properties</Button>
                </div>
            </div>
        );
    }

    const { agent, properties } = data;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {/* Agent Profile Card */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                            {agent.profile?.image ? (
                                <img
                                    src={agent.profile.image}
                                    alt={agent.profile.name || agent.username}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-4xl font-bold text-primary">
                                        {(agent.first_name || agent.username).charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {agent.profile?.name || `${agent.first_name} ${agent.last_name}` || agent.username}
                                </h1>
                                {agent.agent_profile?.verified && (
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                        Verified
                                    </span>
                                )}
                            </div>

                            {agent.agent_profile?.agency_name && (
                                <div className="flex items-center gap-2 text-gray-600 mb-4">
                                    <Building2 className="h-4 w-4" />
                                    <span className="text-lg">{agent.agent_profile.agency_name}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {agent.email && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Mail className="h-4 w-4 text-primary" />
                                        <a href={`mailto:${agent.email}`} className="hover:text-primary">
                                            {agent.email}
                                        </a>
                                    </div>
                                )}

                                {(agent.agent_profile?.phone || agent.profile?.phone_number) && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="h-4 w-4 text-primary" />
                                        <a
                                            href={`tel:${agent.agent_profile?.phone || agent.profile?.phone_number}`}
                                            className="hover:text-primary"
                                        >
                                            {agent.agent_profile?.phone || agent.profile?.phone_number}
                                        </a>
                                    </div>
                                )}

                                {agent.profile?.address && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span>{agent.profile.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button onClick={() => {
                            // Check if user is logged in (we can check if we have a token or useAuth)
                            // For now, let's just navigate and let the protected route handle it, 
                            // or better, check for token in localStorage since we don't have useAuth imported yet.
                            // Actually, let's import useAuth.
                            navigate('/communication', { state: { recipientId: agent.id } });
                        }} className="w-full md:w-auto">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message Agent
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Agent's Properties */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Properties by {agent.profile?.name || agent.username} ({properties.length})
                </h2>

                {properties.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">This agent has no active properties listed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <Card
                                key={property.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => navigate(`/properties/${property.id}`)}
                            >
                                {property.media && property.media.length > 0 && property.media[0].Images && (
                                    <img
                                        src={property.media[0].Images}
                                        alt={property.title}
                                        className="w-full h-48 object-cover rounded-t-lg"
                                    />
                                )}
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                                    <p className="text-2xl font-bold text-primary mb-2">
                                        TZS {property.price.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        {property.bedrooms > 0 && <span>{property.bedrooms} beds</span>}
                                        {property.bathrooms > 0 && <span>{property.bathrooms} baths</span>}
                                        {property.area && <span>{property.area} sqft</span>}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {property.city}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
