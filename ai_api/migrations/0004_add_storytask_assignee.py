from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ai_api', '0003_projectmember_user_email_projectmember_user_name_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='storytask',
            name='assignee',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.SET_NULL,
                blank=True,
                null=True,
                related_name='assigned_tasks',
                to='ai_api.projectmember',
            ),
        ),
    ]


