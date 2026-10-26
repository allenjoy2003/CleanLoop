from rest_framework import serializers
from .models import Plan, Subscription, ScheduledPickup
from waste_info.serializers import WasteCategorySerializer
from accounts.serializers import AddressSerializer

class PlanSerializer(serializers.ModelSerializer):
    waste_categories_details = WasteCategorySerializer(source='waste_categories', many=True, read_only=True)

    class Meta:
        model = Plan
        fields = '__all__'

class ScheduledPickupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledPickup
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = PlanSerializer(source='plan', read_only=True)
    address_details = AddressSerializer(source='address', read_only=True)
    scheduled_pickups = ScheduledPickupSerializer(many=True, read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'subscription_code', 'user', 'plan', 'plan_details',
            'address', 'address_details', 'status', 'start_date', 'end_date',
            'auto_renew', 'paused_at', 'preferred_time_window',
            'scheduled_pickups', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subscription_code', 'user', 'created_at', 'updated_at']
