from django.core.management.base import BaseCommand
from ai_api.models import ProjectInvitation, ProjectMember


class Command(BaseCommand):
    help = 'Clean up orphaned project invitations for users who are already project members'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find invitations where the invitee is already a member of the project
        orphaned_invitations = []
        
        for invitation in ProjectInvitation.objects.filter(status='pending'):
            if ProjectMember.objects.filter(
                project=invitation.project,
                user=invitation.invitee
            ).exists():
                orphaned_invitations.append(invitation)
        
        if not orphaned_invitations:
            self.stdout.write(
                self.style.SUCCESS('No orphaned invitations found.')
            )
            return
        
        self.stdout.write(f'Found {len(orphaned_invitations)} orphaned invitations:')
        
        for invitation in orphaned_invitations:
            self.stdout.write(
                f'  - {invitation.invitee.name} -> {invitation.project.title} '
                f'(invited by {invitation.invited_by.name})'
            )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: Would delete these orphaned invitations.')
            )
        else:
            # Delete the orphaned invitations
            deleted_count, _ = ProjectInvitation.objects.filter(
                id__in=[inv.id for inv in orphaned_invitations]
            ).delete()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {deleted_count} orphaned invitations.')
            )
