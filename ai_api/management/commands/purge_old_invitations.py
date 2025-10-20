from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from ai_api.models import ProjectInvitation


class Command(BaseCommand):
    help = 'Delete declined project invitations older than specified days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days after which declined invitations should be deleted (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        # Calculate cutoff date
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Find declined invitations older than cutoff
        old_invitations = ProjectInvitation.objects.filter(
            status='declined',
            updated_at__lt=cutoff_date
        )
        
        count = old_invitations.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'No declined invitations older than {days} days found.')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {count} declined invitations older than {days} days.')
            )
            for invitation in old_invitations:
                self.stdout.write(
                    f'  - {invitation.invitee.name} -> {invitation.project.title} '
                    f'(declined on {invitation.updated_at.strftime("%Y-%m-%d %H:%M")})'
                )
        else:
            # Delete the invitations
            deleted_count, _ = old_invitations.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {deleted_count} declined invitations older than {days} days.')
            )
