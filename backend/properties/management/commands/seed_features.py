"""
Management command to seed initial features in the database.
Run with: python manage.py seed_features
"""
from django.core.management.base import BaseCommand
from properties.models import Feature


class Command(BaseCommand):
    help = 'Seed initial features for subscription plans'

    def handle(self, *args, **kwargs):
        features_data = [
            {
                'code': 'create_property',
                'name': 'Create Property',
                'description': 'Ability to create new property listings',
                'is_active': True,
            },
            {
                'code': 'edit_property',
                'name': 'Edit Property',
                'description': 'Ability to edit existing property listings',
                'is_active': True,
            },
            {
                'code': 'delete_property',
                'name': 'Delete Property',
                'description': 'Ability to delete property listings',
                'is_active': True,
            },
            {
                'code': 'view_analytics',
                'name': 'View Analytics',
                'description': 'Access to detailed analytics and insights',
                'is_active': True,
            },
            {
                'code': 'messaging',
                'name': 'Messaging',
                'description': 'Access to messaging system',
                'is_active': True,
            },
            {
                'code': 'advanced_messaging',
                'name': 'Advanced Messaging',
                'description': 'Access to advanced messaging features',
                'is_active': True,
            },
        ]

        created_count = 0
        updated_count = 0

        for feature_data in features_data:
            feature, created = Feature.objects.update_or_create(
                code=feature_data['code'],
                defaults={
                    'name': feature_data['name'],
                    'description': feature_data['description'],
                    'is_active': feature_data['is_active'],
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created feature: {feature.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'↻ Updated feature: {feature.name}'))

        self.stdout.write(self.style.SUCCESS(f'\n✓ Seeding complete!'))
        self.stdout.write(self.style.SUCCESS(f'  Created: {created_count}'))
        self.stdout.write(self.style.SUCCESS(f'  Updated: {updated_count}'))
        self.stdout.write(self.style.SUCCESS(f'  Total: {Feature.objects.count()} features in database'))
