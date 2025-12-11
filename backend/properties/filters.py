import django_filters
from .models import Property

class PropertyFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    property_type = django_filters.CharFilter(field_name="type", lookup_expr='exact')
    listing_type = django_filters.CharFilter(field_name="listing_type", lookup_expr='exact')
    city = django_filters.CharFilter(lookup_expr='icontains')
    bedrooms = django_filters.NumberFilter(lookup_expr='gte')
    bathrooms = django_filters.NumberFilter(lookup_expr='gte')
    amenities = django_filters.CharFilter(method='filter_amenities')
    agent = django_filters.CharFilter(field_name='owner__username', lookup_expr='icontains')
    
    class Meta:
        model = Property
        fields = ['min_price', 'max_price', 'property_type', 'listing_type', 'city', 'bedrooms', 'bathrooms', 'amenities', 'status', 'is_published', 'owner']

    def filter_amenities(self, queryset, name, value):
        amenities_list = value.split(',')
        for amenity in amenities_list:
            queryset = queryset.filter(property_features__features__icontains=amenity.strip())
        return queryset
