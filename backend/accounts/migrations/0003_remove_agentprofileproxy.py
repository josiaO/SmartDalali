from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_agentprofileproxy'),
    ]

    operations = [
        migrations.DeleteModel(
            name='AgentProfileProxy',
        ),
    ]

