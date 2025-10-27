from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Update all users to have the role "developer"'

    def add_arguments(self, parser):
        parser.add_argument(
            '--role',
            type=str,
            default='developer',
            help='Role to assign to all users (default: developer)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes'
        )

    def handle(self, *args, **options):
        role = options['role']
        dry_run = options['dry_run']
        
        # Get all users
        users = User.objects.all()
        user_count = users.count()
        
        if user_count == 0:
            self.stdout.write(
                self.style.WARNING('No users found in the database.')
            )
            return
        
        self.stdout.write(f'Found {user_count} users in the database.')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN - No changes will be made')
            )
            for user in users:
                current_role = user.role or 'None'
                self.stdout.write(
                    f'  - {user.name} ({user.email}): {current_role} -> {role}'
                )
        else:
            # Update all users to have the specified role
            updated_count = users.update(role=role)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated {updated_count} users to have role "{role}"'
                )
            )
            
            # Show the updated users
            for user in users:
                self.stdout.write(f'  - {user.name} ({user.email}): {user.role}')
