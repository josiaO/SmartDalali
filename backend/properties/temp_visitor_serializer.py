
class PropertyVisitSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    property_details = serializers.SerializerMethodField()
    agent_details = serializers.SerializerMethodField()

    class Meta:
        model = PropertyVisit
        fields = [
            'id', 'property', 'user', 'agent', 'date', 'time',
            'status', 'notes', 'created_at', 'user_details',
            'property_details', 'agent_details'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_user_details(self, obj):
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "full_name": obj.user.get_full_name() or obj.user.username,
            "email": obj.user.email
        }
        
    def get_agent_details(self, obj):
         return {
            "id": obj.agent.id,
            "username": obj.agent.username,
            "full_name": obj.agent.get_full_name() or obj.agent.username,
        }

    def get_property_details(self, obj):
        return {
            "id": obj.property.id,
            "title": obj.property.title,
            "city": obj.property.city,
            "price": obj.property.price,
            "image": self.get_property_image(obj.property)
        }

    def get_property_image(self, property_obj):
        image = property_obj.media.filter(media_type='image').first()
        if image:
            return image.image_url
        return None
