# Generated by Django 5.0.6 on 2024-07-09 11:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('connection', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConnectionModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('json_data', models.TextField()),
            ],
        ),
        migrations.DeleteModel(
            name='MyModel',
        ),
    ]