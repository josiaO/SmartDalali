# Generated manually for message encryption

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('communications', '0008_alter_conversation_unique_together'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='text_encrypted',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='message',
            name='is_encrypted',
            field=models.BooleanField(default=False),
        ),
    ]
