"""
Django management command to generate test data for SmartDalali.
Downloads images using the scraper and creates realistic property listings and agent profiles.

Usage: python manage.py generate_test_data
"""
import os
import random
import asyncio
import aiohttp
import aiofiles
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.core.files import File
from django.conf import settings
from django.utils import timezone
from properties.models import Property, MediaProperty, AgentProfile
from features.models import Feature, SubscriptionPlan
from accounts.models import Profile
from datetime import timedelta
import requests
from bs4 import BeautifulSoup


class Command(BaseCommand):
    help = 'Generate test data with real images for properties and agents'

    def add_arguments(self, parser):
        parser.add_argument(
            '--agents',
            type=int,
            default=100,
            help='Number of agent profiles to create (default: 30)'
        )
        parser.add_argument(
            '--properties',
            type=int,
            default=150,
            help='Number of properties to create (default: 100)'
        )

    def handle(self, *args, **options):
        num_agents = options['agents']
        num_properties = options['properties']

        self.stdout.write(self.style.SUCCESS('=== SmartDalali Test Data Generator ===\n'))
        
        # Suppress insecure request warnings
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        # Step 1: Download images
        self.stdout.write('Step 1: Downloading images...')
        house_images = self.download_images(
            'https://unsplash.com/s/photos/house',
            'houses',
            num_properties * 3  # 3 images per property average
        )
        people_images = self.download_images(
            'https://unsplash.com/t/people',
            'people',
            num_agents
        )

        # Step 2: Create agents
        self.stdout.write(f'\nStep 2: Creating {num_agents} agent profiles...')
        agents = self.create_agents(num_agents, people_images)

        # Step 3: Create properties
        self.stdout.write(f'\nStep 3: Creating {num_properties} properties...')
        properties = self.create_properties(num_properties, agents, house_images)

        self.stdout.write(self.style.SUCCESS(f'\n✓ Test data generation complete!'))
        self.stdout.write(self.style.SUCCESS(f'  - Created {len(agents)} agents'))
        self.stdout.write(self.style.SUCCESS(f'  - Created {len(properties)} properties'))

    def download_images(self, url, category, max_images):
        """Download images from Unsplash"""
        self.stdout.write(f'  Scraping {url}...')
        
        try:
            # Added verify=False to handle potential SSL issues in local/dev environments
            html = requests.get(url, timeout=10, verify=False).text
            soup = BeautifulSoup(html, 'html.parser')
            
            image_urls = []
            for img in soup.find_all('img'):
                src = img.get('src')
                if src and 'images.unsplash.com' in src:
                    image_urls.append(src)
                if len(image_urls) >= max_images:
                    break
            
            self.stdout.write(f'  Found {len(image_urls)} image URLs')
            
            # Download images
            save_dir = os.path.join(settings.MEDIA_ROOT, f'test_data/{category}')
            os.makedirs(save_dir, exist_ok=True)
            
            downloaded = []
            for i, img_url in enumerate(image_urls[:max_images]):
                try:
                    response = requests.get(img_url, timeout=10, verify=False)
                    if response.status_code == 200:
                        filename = f'{category}_{i+1}.jpg'
                        filepath = os.path.join(save_dir, filename)
                        with open(filepath, 'wb') as f:
                            f.write(response.content)
                        downloaded.append(filepath)
                        if (i + 1) % 10 == 0:
                            self.stdout.write(f'    Downloaded {i+1}/{max_images}...')
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'    Failed to download image {i+1}: {e}'))
            
            self.stdout.write(self.style.SUCCESS(f'  ✓ Downloaded {len(downloaded)} images'))
            # Fallback if no images downloaded
            if not downloaded:
                self.stdout.write(self.style.WARNING("  ! No images downloaded. Generating placeholders..."))
                return self.generate_placeholders(save_dir, category, max_images)
                
            return downloaded
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  ✗ Failed to scrape images: {e}'))
            return self.generate_placeholders(os.path.join(settings.MEDIA_ROOT, f'test_data/{category}'), category, max_images)

    def generate_placeholders(self, save_dir, category, count):
        """Generate placeholder images when download fails"""
        os.makedirs(save_dir, exist_ok=True)
        paths = []
        # 1x1 gray pixel JPEG
        placeholder_data = b'/9j/4AAQSkZJRgABAQEASABIAAD/2wBDCAgKCgoKCgsKCgoICgoKCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AH8AL//Z'
        
        import base64
        data = base64.b64decode(placeholder_data)
        
        for i in range(count):
            filename = f'{category}_placeholder_{i+1}.jpg'
            filepath = os.path.join(save_dir, filename)
            with open(filepath, 'wb') as f:
                f.write(data)
            paths.append(filepath)
            
        self.stdout.write(self.style.SUCCESS(f'  ✓ Generated {count} placeholder images'))
        return paths

    def create_agents(self, count, image_paths):
        """Create agent user accounts with profiles"""
        agents = []
        agent_group, _ = Group.objects.get_or_create(name='agent')
        
        first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia', 'Robert', 'Sophia', 'William', 'Ava', 'Joseph', 'Isabella', 'Charles']
        last_names = ['Mwangi', 'Kamau', 'Ochieng', 'Moshi', 'Njoroge', 'Wanjiru', 'Kimani', 'Otieno', 'Mwamba', 'Nyambura', 'Kariuki', 'Achieng', 'Mutua', 'Wambui', 'Omondi']
        
        for i in range(count):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            username = f'{first_name.lower()}.{last_name.lower()}{i+1}'
            email = f'{username}@smartdalali.co.tz'
            
            # Create user
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_active': True,
                }
            )
            
            if created:
                user.set_password('password123')
                user.save()
                user.groups.add(agent_group)
                
                # Update profile with image
                profile = user.profile
                if i < len(image_paths):
                    with open(image_paths[i], 'rb') as img_file:
                        profile.image.save(f'agent_{i+1}.jpg', File(img_file), save=True)
                
                profile.name = f'{first_name} {last_name}'
                profile.phone_number = f'+255{random.randint(700000000, 799999999)}'
                profile.address = random.choice([
                    'Dar es Salaam, Tanzania',
                    'Arusha, Tanzania',
                    'Mwanza, Tanzania',
                    'Dodoma, Tanzania',
                    'Mbeya, Tanzania',
                ])
                profile.save()
                
                # Create agent profile
                agent_profile, _ = AgentProfile.objects.get_or_create(
                    user=user,
                    profile=profile,
                    defaults={
                        'agency_name': f'{last_name} Properties Ltd',
                        'phone': profile.phone_number,
                        'verified': True,
                        'subscription_active': True,
                        'subscription_expires': timezone.now() + timedelta(days=30),
                    }
                )
                
                agents.append(user)
                self.stdout.write(f'  ✓ Created agent: {username}')
        
        return agents

    def create_properties(self, count, agents, image_paths):
        """Create property listings with multiple images"""
        properties = []
        
        locations = [
            'Masaki, Dar es Salaam',
            'Mikocheni, Dar es Salaam',
            'Oysterbay, Dar es Salaam',
            'Mbezi Beach, Dar es Salaam',
            'Kawe, Dar es Salaam',
            'Arusha City Center',
            'Mwanza Waterfront',
            'Dodoma Central',
            'Mbeya Highlands',
        ]
        
        property_types = ['house', 'apartment', 'land', 'commercial']
        statuses = ['available', 'sold', 'rented']
        
        titles = [
            'Luxury Villa with Ocean View',
            'Modern 3-Bedroom Apartment',
            'Spacious Family Home',
            'Prime Commercial Property',
            'Beachfront Paradise',
            'Executive Penthouse Suite',
            'Cozy Starter Home',
            'Investment Property',
            'Elegant Townhouse',
            'Contemporary Loft',
        ]
        
        for i in range(count):
            agent = random.choice(agents)
            prop_type = random.choice(property_types)
            
            # Create property
            property_obj = Property.objects.create(
                owner=agent,
                title=f'{random.choice(titles)} - {i+1}',
                description=f'Beautiful {prop_type} in prime location. Features modern amenities, spacious rooms, and excellent connectivity. Perfect for families or investors looking for quality real estate in Tanzania.',
                price=random.randint(5000000, 50000000) / 100 * 100,  # Round to nearest 100
                type=prop_type,
                status=random.choice(statuses),
                rooms=random.randint(2, 8) if prop_type in ['house', 'apartment'] else 0,
                bedrooms=random.randint(1, 5) if prop_type in ['house', 'apartment'] else 0,
                bathrooms=random.randint(1, 4) if prop_type in ['house', 'apartment'] else 0,
                area=random.randint(50, 500),
                adress=random.choice(locations),  # Note: model has typo 'adress' not 'address'
                city=random.choice(['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya']),
                latitude=-6.7924 + random.uniform(-2, 2),
                longitude=39.2083 + random.uniform(-2, 2),
                is_published=True,  # Make properties visible in public listings
            )
            
            # Add 2-5 images per property
            num_images = random.randint(2, 5)
            available_images = image_paths[i*5:(i+1)*5] if i*5 < len(image_paths) else image_paths[-5:]
            
            for img_idx, img_path in enumerate(available_images[:num_images]):
                if os.path.exists(img_path):
                    with open(img_path, 'rb') as img_file:
                        MediaProperty.objects.create(
                            property=property_obj,
                            Images=File(img_file, name=f'property_{i+1}_img_{img_idx+1}.jpg')
                        )
            
            properties.append(property_obj)
            if (i + 1) % 10 == 0:
                self.stdout.write(f'  Created {i+1}/{count} properties...')
        
        return properties
