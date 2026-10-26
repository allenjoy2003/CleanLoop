import re
from django.conf import settings
from rest_framework import serializers
from .models import User, Address, Zone

PHONE_REGEX = re.compile(r'^\+91[6-9]\d{9}$')

def normalize_and_validate_phone(phone_input):
    if not phone_input:
        raise serializers.ValidationError("Phone number is required.")
    phone = str(phone_input).strip().replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        if phone.startswith("91") and len(phone) == 12:
            phone = "+" + phone
        elif len(phone) == 10:
            phone = "+91" + phone
        else:
            phone = "+91" + phone
    
    if not PHONE_REGEX.match(phone):
        raise serializers.ValidationError("Please provide a valid 10-digit Indian mobile number (+91XXXXXXXXXX).")
    return phone

class RequestOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        return normalize_and_validate_phone(value)

class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    otp = serializers.CharField(max_length=6, min_length=6)
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    preferred_language = serializers.ChoiceField(choices=['en', 'ml'], required=False, default='en')

    def validate_phone(self, value):
        return normalize_and_validate_phone(value)

    def validate_otp(self, value):
        val = str(value).strip()
        if not val.isdigit() or len(val) != 6:
            raise serializers.ValidationError("OTP must be a 6-digit numeric code.")
        return val

class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = '__all__'

class AddressSerializer(serializers.ModelSerializer):
    zone_details = ZoneSerializer(source='zone', read_only=True)

    class Meta:
        model = Address
        fields = ['id', 'label', 'full_address', 'ward', 'landmark', 'zone', 'zone_details', 'latitude', 'longitude', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        if validated_data.get('is_default'):
            Address.objects.filter(user=user, is_default=True).update(is_default=False)
        return Address.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        if validated_data.get('is_default'):
            Address.objects.filter(user=instance.user, is_default=True).exclude(id=instance.id).update(is_default=False)
        return super().update(instance, validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)
    wallet_balance = serializers.SerializerMethodField()
    reward_credits = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'name', 'email', 'role', 'preferred_language',
            'notify_sms', 'notify_email', 'wallet_balance', 'reward_credits',
            'badge', 'addresses', 'created_at'
        ]
        read_only_fields = ['id', 'phone', 'role', 'created_at']

    def get_wallet_balance(self, obj):
        wallet = getattr(obj, 'wallet', None)
        return float(wallet.balance) if wallet else 0.0

    def get_reward_credits(self, obj):
        rewards = getattr(obj, 'reward_profile', None)
        return rewards.current_green_credits if rewards else 0

    def get_badge(self, obj):
        rewards = getattr(obj, 'reward_profile', None)
        if rewards and rewards.current_badge:
            return {
                'slug': rewards.current_badge.slug,
                'name_en': rewards.current_badge.name_en,
                'name_ml': rewards.current_badge.name_ml,
                'icon': rewards.current_badge.icon,
                'color': rewards.current_badge.color,
            }
        return None
