export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  type: "sale" | "rent" | "land";
  propertyType: string;
  location: {
    city: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  agentId: string;
  agentName: string;
  agentPhone: string;
  featured: boolean;
  status: "published" | "pending" | "draft";
  createdAt: string;
}

export const mockProperties: Property[] = [
  {
    id: 1,
    title: "Modern 3BR Apartment in Masaki",
    description: "Luxurious apartment with ocean view, fully furnished with modern amenities. Located in the prestigious Masaki neighborhood.",
    price: 1200000,
    type: "sale",
    propertyType: "Apartment",
    location: {
      city: "Dar es Salaam",
      address: "Masaki Peninsula",
      coordinates: { lat: -6.7635, lng: 39.2719 },
    },
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    agentId: "2",
    agentName: "John Agent",
    agentPhone: "+255 712 345 678",
    featured: true,
    status: "published",
    createdAt: "2025-01-10",
  },
  {
    id: 2,
    title: "Spacious Villa in Mikocheni",
    description: "Beautiful 4-bedroom villa with garden and swimming pool. Perfect for families.",
    price: 2500000,
    type: "sale",
    propertyType: "Villa",
    location: {
      city: "Dar es Salaam",
      address: "Mikocheni A",
      coordinates: { lat: -6.7700, lng: 39.2200 },
    },
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    ],
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    agentId: "2",
    agentName: "John Agent",
    agentPhone: "+255 712 345 678",
    featured: true,
    status: "published",
    createdAt: "2025-01-15",
  },
  {
    id: 3,
    title: "Affordable 2BR Flat - Kinondoni",
    description: "Cozy 2-bedroom apartment perfect for small families or young professionals.",
    price: 800,
    type: "rent",
    propertyType: "Apartment",
    location: {
      city: "Dar es Salaam",
      address: "Kinondoni",
      coordinates: { lat: -6.7800, lng: 39.2300 },
    },
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    ],
    bedrooms: 2,
    bathrooms: 1,
    area: 80,
    agentId: "2",
    agentName: "John Agent",
    agentPhone: "+255 712 345 678",
    featured: false,
    status: "published",
    createdAt: "2025-01-12",
  },
  {
    id: 4,
    title: "Prime Land Plot - Tegeta Beach",
    description: "2-acre beachfront land perfect for resort or residential development.",
    price: 500000,
    type: "land",
    propertyType: "Land",
    location: {
      city: "Dar es Salaam",
      address: "Tegeta Beach",
      coordinates: { lat: -6.6500, lng: 39.2100 },
    },
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    ],
    area: 8000,
    agentId: "2",
    agentName: "John Agent",
    agentPhone: "+255 712 345 678",
    featured: true,
    status: "published",
    createdAt: "2025-01-08",
  },
  {
    id: 5,
    title: "Office Space in City Center",
    description: "Modern office space in prime location, suitable for businesses.",
    price: 1500,
    type: "rent",
    propertyType: "Commercial",
    location: {
      city: "Dar es Salaam",
      address: "CBD",
      coordinates: { lat: -6.8160, lng: 39.2803 },
    },
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    ],
    area: 120,
    agentId: "2",
    agentName: "John Agent",
    agentPhone: "+255 712 345 678",
    featured: false,
    status: "published",
    createdAt: "2025-01-14",
  },
  {
    id: 6,
    title: "Luxury Penthouse - Oysterbay",
    description: "Ultra-modern penthouse with panoramic city and ocean views.",
    price: 3500000,
    type: "sale",
    propertyType: "Penthouse",
    location: {
      city: "Dar es Salaam",
      address: "Oysterbay",
      coordinates: { lat: -6.7700, lng: 39.2650 },
    },
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    ],
    bedrooms: 5,
    bathrooms: 4,
    area: 400,
    agentId: "2",
    agentName: "John Agent",
    agentPhone: "+255 712 345 678",
    featured: true,
    status: "published",
    createdAt: "2025-01-16",
  },
];
