# Generated manually for database performance indexes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('communications', '0009_add_encrypted_fields'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['conversation', '-created_at'], name='msg_conv_created_idx'),
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['read_at'], name='msg_read_at_idx'),
        ),
        migrations.AddIndex(
            model_name='conversation',
            index=models.Index(fields=['-updated_at'], name='conv_updated_idx'),
        ),
    ]
