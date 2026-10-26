from rest_framework import serializers
from .models import StaffMember, Slot, Booking, BookingItem
from accounts.serializers import AddressSerializer, ZoneSerializer
from waste_info.serializers import WasteCategorySerializer
from waste_info.models import WasteCategory
from accounts.models import Address

class StaffMemberSerializer(serializers.ModelSerializer):
    service_zone_details = ZoneSerializer(source='service_zone', read_only=True)

    class Meta:
        model = StaffMember
        fields = '__all__'

class SlotSerializer(serializers.ModelSerializer):
    zone_details = ZoneSerializer(source='zone', read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    slot_label = serializers.CharField(read_only=True)

    class Meta:
        model = Slot
        fields = [
            'id', 'zone', 'zone_details', 'date', 'start_time', 'end_time',
            'capacity', 'booked_count', 'is_available', 'slot_label', 'is_active'
        ]

class BookingItemSerializer(serializers.ModelSerializer):
    category_details = WasteCategorySerializer(source='category', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=WasteCategory.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = BookingItem
        fields = ['id', 'category', 'category_id', 'category_details', 'approx_weight_kg', 'notes']
        read_only_fields = ['id', 'category']

class BookingSerializer(serializers.ModelSerializer):
    items = BookingItemSerializer(many=True, required=False)
    address_details = AddressSerializer(source='address', read_only=True)
    assigned_staff_details = StaffMemberSerializer(source='assigned_staff', read_only=True)
    slot_details = SlotSerializer(source='slot', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_number', 'customer', 'address', 'address_details',
            'slot', 'slot_details', 'pickup_date', 'preferred_time_window',
            'assigned_staff', 'assigned_staff_details', 'status',
            'estimated_quantity_kg', 'actual_quantity_kg', 'is_well_segregated',
            'green_credits_awarded', 'photo', 'notes', 'rating', 'review',
            'cancellation_reason', 'fee_amount', 'is_paid', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'booking_number', 'customer', 'created_at', 'updated_at']

    def create(self, validated_data):
        import uuid
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        slot = validated_data.get('slot')

        # Check slot capacity
        if slot:
            if not slot.is_available:
                raise serializers.ValidationError({"slot": "Selected slot is already at full capacity. Please choose another slot."})
            slot.booked_count += 1
            slot.save()

        # Generate friendly booking number e.g. CL-BK-20261025-XXXX
        booking_number = f"CL-BK-{uuid.uuid4().hex[:6].upper()}"
        booking = Booking.objects.create(
            customer=user,
            booking_number=booking_number,
            **validated_data
        )

        for item_data in items_data:
            BookingItem.objects.create(booking=booking, **item_data)

        # Create user notification
        from impact.models import Notification
        Notification.objects.create(
            user=user,
            title_en="Waste Pickup Requested",
            title_ml="മാലിന്യ ശേഖരണ ബുക്കിംഗ് വിജയകരം",
            message_en=f"Your pickup #{booking.booking_number} for {booking.pickup_date} has been placed.",
            message_ml=f"നിങ്ങളുടെ ബുക്കിംഗ് #{booking.booking_number} ({booking.pickup_date}) സ്ഥിരീകരണത്തിനായി സമർപ്പിച്ചു.",
            notification_type='booking_update',
            link_url=f"/bookings/{booking.id}"
        )

        return booking
