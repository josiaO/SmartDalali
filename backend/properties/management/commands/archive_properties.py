"""
Django management command to auto-archive sold/rented properties.
Run daily via cron: 0 2 * * * python manage.py archive_properties
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from properties.models import Property


class Command(BaseCommand):
    help = 'Auto-archive sold/rented properties after specified days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be archived without actually archiving',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write(self.style.SUCCESS('=== Property Auto-Archiving ===\n'))
        
        # Find properties that should be archived
        properties = Property.objects.filter(archived_at__isnull=True)
        to_archive = [p for p in properties if p.should_be_archived()]
        
        if not to_archive:
            self.stdout.write(self.style.SUCCESS('No properties need archiving.'))
            return
        
        self.stdout.write(f'Found {len(to_archive)} properties to archive:\n')
        
        for prop in to_archive:
            days_since_update = (timezone.now() - prop.updated_at).days
            self.stdout.write(
                f'  - {prop.title} (ID: {prop.id})\n'
                f'    Status: {prop.status}\n'
                f'    Days since update: {days_since_update}\n'
            )
            
            if not dry_run:
                prop.archive()
                self.stdout.write(self.style.SUCCESS(f'    ✓ Archived\n'))
            else:
                self.stdout.write(self.style.WARNING(f'    [DRY RUN] Would archive\n'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING(f'\n✓ Dry run complete. {len(to_archive)} properties would be archived.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\n✓ Archived {len(to_archive)} properties.'))
