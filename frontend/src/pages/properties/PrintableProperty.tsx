import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProperty, type Property } from '@/api/properties';
import { formatTZS } from '@/lib/currency';
import { MapPin, Bed, Bath, Square, Phone, Mail, Globe } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function PrintableProperty() {
    const { id } = useParams<{ id: string }>();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProperty() {
            if (!id) return;
            try {
                const data = await fetchProperty(id);
                setProperty(data);
            } catch (error) {
                console.error("Failed to load property", error);
            } finally {
                setLoading(false);
            }
        }
        loadProperty();
    }, [id]);

    useEffect(() => {
        if (!loading && property) {
            // Automatically trigger print dialog when ready
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [loading, property]);

    if (loading) return <LoadingSpinner />;
    if (!property) return <div className="p-8 text-center">Property not found</div>;

    return (
        <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold tracking-tight">SmartDalali</span>
                    </div>
                    <p className="text-sm text-gray-500">Premium Real Estate Listings</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        smartdalali.com
                    </div>
                </div>
            </div>

            {/* Property Title & Price */}
            <div className="mb-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                        <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {property.city}, {property.address}
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                        {formatTZS(property.price)}
                    </div>
                </div>
            </div>

            {/* Main Image */}
            <div className="mb-8 aspect-video w-full rounded-xl overflow-hidden bg-gray-100 border">
                <img
                    src={property.main_image_url || property.media?.[0]?.Images || '/placeholder.svg'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg border print:bg-transparent print:border-gray-200">
                <div className="text-center">
                    <div className="flex justify-center mb-1"><Bed className="w-5 h-5" /></div>
                    <div className="font-bold">{property.bedrooms} Beds</div>
                </div>
                <div className="text-center">
                    <div className="flex justify-center mb-1"><Bath className="w-5 h-5" /></div>
                    <div className="font-bold">{property.bathrooms} Baths</div>
                </div>
                <div className="text-center">
                    <div className="flex justify-center mb-1"><Square className="w-5 h-5" /></div>
                    <div className="font-bold">{property.area || '-'} sq ft</div>
                </div>
                <div className="text-center">
                    <div className="font-medium text-sm text-gray-500 uppercase">Type</div>
                    <div className="font-bold">{property.type}</div>
                </div>
            </div>

            {/* Description */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-3 border-b pb-2">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-justify text-sm">
                    {property.description}
                </p>
            </div>

            {/* Amenities / Features */}
            {property.property_features && property.property_features.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-3 border-b pb-2">Features</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {property.property_features.map((feat) => (
                            <div key={feat.id} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-black mb-0.5"></div>
                                {feat.features}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Additional Images (Print only: show top 2) */}
            {property.media && property.media.length > 1 && (
                <div className="grid grid-cols-2 gap-4 mb-8 print:break-inside-avoid">
                    {property.media.slice(1, 3).map((item, idx) => (
                        !item.videos && (
                            <div key={idx} className="aspect-video w-full rounded-lg overflow-hidden border bg-gray-100 print:border-gray-200">
                                <img src={item.Images} alt="Property view" className="w-full h-full object-cover" />
                            </div>
                        )
                    ))}
                </div>
            )}

            {/* Footer / Agent Contact */}
            <div className="mt-auto pt-6 border-t print:break-inside-avoid">
                <div className="flex items-center gap-4">
                    {property.agent.profile_picture ? (
                        <img
                            src={property.agent.profile_picture}
                            className="w-16 h-16 rounded-full object-cover border"
                            alt="Agent"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                            {property.agent.first_name?.[0]}
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-lg">{property.agent.first_name} {property.agent.last_name}</p>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {property.agent.email}
                            </div>
                            {property.agent.phone_number && (
                                <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {property.agent.phone_number}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
