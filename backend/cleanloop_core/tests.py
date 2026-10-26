from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, time, timedelta

from accounts.models import User, Zone, Address
from waste_collections.models import Slot, Booking
from scrap.models import ScrapCategory, ScrapRequest, ScrapRequestItem, Wallet
from subscriptions.models import Plan, Subscription, ScheduledPickup
from payments.models import Payment

class CleanLoopCoreTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(phone='+919846011111', name='Test Customer')
        self.admin = User.objects.create_user(phone='+919846099999', name='Test Admin', role='admin', is_staff=True)
        self.zone = Zone.objects.create(name_en='Kakkanad', name_ml='കാക്കനാട്')
        self.address = Address.objects.create(
            user=self.customer,
            label='home',
            full_address='123 Test St, Kochi',
            latitude=10.01,
            longitude=76.34,
            zone=self.zone
        )

    @override_settings(OTP_DEV_MODE=True)
    def test_dev_mode_otp_verification(self):
        # 1. Request OTP
        req_res = self.client.post('/api/accounts/auth/otp/request/', {'phone': '+919846055555'})
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)

        # 2. Verify with fixed test OTP in dev mode
        verify_res = self.client.post('/api/accounts/auth/otp/verify/', {
            'phone': '+919846055555',
            'otp': '123456',
            'name': 'New Dev User'
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', verify_res.data)
        self.assertIn('refresh', verify_res.data)

    def test_booking_slot_capacity_constraint(self):
        self.client.force_authenticate(user=self.customer)
        slot = Slot.objects.create(
            zone=self.zone,
            date=date.today() + timedelta(days=1),
            start_time=time(8, 0),
            end_time=time(10, 0),
            capacity=1,
            booked_count=1 # already full
        )

        res = self.client.post('/api/collections/bookings/', {
            'address': self.address.id,
            'slot': slot.id,
            'pickup_date': str(slot.date),
            'estimated_quantity_kg': 5.0
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('slot', res.data)

    def test_scrap_payout_and_wallet_credit(self):
        sc = ScrapCategory.objects.create(
            slug='copper_test',
            name_en='Copper',
            name_ml='ചെമ്പ്',
            current_rate_per_kg=400.00
        )
        scrap_req = ScrapRequest.objects.create(
            customer=self.customer,
            request_number='CL-SC-TEST1',
            address=self.address,
            pickup_date=date.today(),
            status='requested'
        )
        item = ScrapRequestItem.objects.create(
            scrap_request=scrap_req,
            category=sc,
            estimated_weight_kg=2.0,
            rate_per_kg_locked=sc.current_rate_per_kg,
            payout_amount=800.00
        )

        # Admin weighs 3.0 kg @ ₹400 = ₹1200.00
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/scrap/requests/{scrap_req.id}/weigh_and_pay/', {
            'items': [{'id': item.id, 'actual_weight_kg': 3.0}]
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        wallet = Wallet.objects.get(user=self.customer)
        self.assertEqual(wallet.balance, 1200.00)

    def test_subscription_creation_and_scheduled_pickups(self):
        self.client.force_authenticate(user=self.customer)
        plan = Plan.objects.create(
            name_en='Daily Test Plan',
            name_ml='ടെസ്റ്റ് പ്ലാൻ',
            plan_type='daily',
            price_inr=199.00
        )

        res = self.client.post('/api/subscriptions/user-subscriptions/', {
            'plan': plan.id,
            'address': self.address.id
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        sub = Subscription.objects.get(id=res.data['id'])
        self.assertTrue(sub.scheduled_pickups.count() > 0)
