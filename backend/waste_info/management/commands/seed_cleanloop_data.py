from datetime import date, time, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone

from accounts.models import User, Zone, Address
from waste_info.models import WasteCategory, DisposalGuide, Fact, Tip, RuleAndFine, FAQ
from waste_collections.models import StaffMember, Slot, Booking, BookingItem
from subscriptions.models import Plan, Subscription, ScheduledPickup
from scrap.models import ScrapCategory, ScrapRateHistory, ScrapRequest, ScrapRequestItem, Wallet
from rewards.models import Badge, RewardRule, UserRewardProfile, GreenCreditLedger
from complaints.models import Complaint
from impact.models import Notification, ImpactMetricConfig

class Command(BaseCommand):
    help = 'Seeds complete bilingual demo data for Clean Loop platform (Kochi, Kerala)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Clean Loop Kochi seed process..."))

        # 1. Admin and Demo Customer
        admin_phone = getattr(settings, 'ADMIN_PHONE', '+919846012345')
        admin_user, _ = User.objects.get_or_create(
            phone=admin_phone,
            defaults={
                'name': 'Kochi Municipal Clean Loop Operator',
                'email': 'admin@cleanloop.kerala.gov.in',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'preferred_language': 'en'
            }
        )
        if not admin_user.is_superuser:
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.role = 'admin'
            admin_user.save()

        demo_customer_phone = getattr(settings, 'DEMO_CUSTOMER_PHONE', '+919846098765')
        customer_user, _ = User.objects.get_or_create(
            phone=demo_customer_phone,
            defaults={
                'name': 'Allen K. Thomas',
                'email': 'allen.resident@cleanloop.in',
                'role': 'customer',
                'preferred_language': 'en'
            }
        )

        Wallet.objects.get_or_create(user=customer_user, defaults={'balance': 150.00})
        Wallet.objects.get_or_create(user=admin_user, defaults={'balance': 0.00})

        # 2. Kochi Zones
        zones_data = [
            {
                "name_en": "Kakkanad & InfoPark Zone",
                "name_ml": "കാക്കനാട് & ഇൻഫോപാർക്ക് സോൺ",
                "ward_numbers": "Wards 12-18, Thrikkakara Municipality",
                "center_lat": 10.0159,
                "center_lng": 76.3419,
            },
            {
                "name_en": "Fort Kochi & Mattancherry Heritage Zone",
                "name_ml": "ഫോർട്ട് കൊച്ചി & മട്ടാഞ്ചേരി പൈതൃക സോൺ",
                "ward_numbers": "Wards 1-8, Kochi Municipal Corporation",
                "center_lat": 9.9658,
                "center_lng": 76.2421,
            },
            {
                "name_en": "Marine Drive, Ernakulam North & MG Road",
                "name_ml": "മറൈൻ ഡ്രൈവ്, നോർത്ത് & എം.ജി. റോഡ്",
                "ward_numbers": "Wards 60-68, Central Kochi",
                "center_lat": 9.9816,
                "center_lng": 76.2799,
            },
            {
                "name_en": "Edappally, Palarivattom & Kaloor",
                "name_ml": "ഇടപ്പള്ളി, പാലാരിവട്ടം & കലൂർ",
                "ward_numbers": "Wards 35-42, Kochi Metro Corridor",
                "center_lat": 10.0261,
                "center_lng": 76.3125,
            },
            {
                "name_en": "Aluva & Kalamassery Industrial Belt",
                "name_ml": "ആലുവ & കളമശ്ശേരി വ്യാവസായിക മേഖല",
                "ward_numbers": "Wards 20-28, North Kochi",
                "center_lat": 10.0538,
                "center_lng": 76.3284,
            }
        ]

        created_zones = []
        for zd in zones_data:
            zone, _ = Zone.objects.get_or_create(name_en=zd['name_en'], defaults=zd)
            created_zones.append(zone)

        # Saved Address for Demo User
        default_address, _ = Address.objects.get_or_create(
            user=customer_user,
            label='home',
            defaults={
                'full_address': 'Flat 4B, Emerald Heights, Seaport-Airport Road, Kakkanad, Kochi, Kerala 682030',
                'ward': 'Ward 14 (Thrikkakara)',
                'landmark': 'Near Kakkanad Civil Station',
                'zone': created_zones[0],
                'latitude': 10.0158605,
                'longitude': 76.3418642,
                'is_default': True
            }
        )

        # 3. Badges & Rewards
        badges_data = [
            ("seedling", "Green Seedling", "ഹരിത തൈ", "Started eco-friendly segregation journey", "തുടക്കക്കാരൻ", "sprout", 0, "#1F5D3A"),
            ("sapling", "Eco Sapling", "പരിസ്ഥിതി തൈ", "Completed 5 successful doorstep waste pickups", "5 വിജയകരമായ ശേഖരണങ്ങൾ പൂർത്തിയാക്കി", "trees", 100, "#2E7D32"),
            ("banyan", "Grand Banyan", "മഹാവൃക്ഷം (ആൽമരം)", "Master recycler saving >100kg CO2 in Kochi", "കൊച്ചിയുടെ പരിസ്ഥിതി കാവലാൾ - 100 കിലോ CO2 കുറച്ചു", "shield-check", 300, "#D4A017"),
        ]
        for slug, n_en, n_ml, d_en, d_ml, icon, pts, col in badges_data:
            Badge.objects.get_or_create(
                slug=slug,
                defaults={
                    'name_en': n_en, 'name_ml': n_ml,
                    'description_en': d_en, 'description_ml': d_ml,
                    'icon': icon, 'points_required': pts, 'color': col
                }
            )

        UserRewardProfile.objects.get_or_create(
            user=customer_user,
            defaults={
                'total_green_credits': 140,
                'current_green_credits': 140,
                'current_badge': Badge.objects.get(slug='sapling'),
                'consecutive_streak_weeks': 4
            }
        )

        # 4. Waste Categories & Complete Disposal Guides
        categories_data = [
            {
                "slug": "wet_food",
                "name_en": "Food & Wet Waste (Organic)",
                "name_ml": "ഭക്ഷണ & നനഞ്ഞ ജൈവ മാലിന്യം",
                "bin_color_en": "Green Bin",
                "bin_color_ml": "പച്ച ബിൻ",
                "color_hex": "#1F5D3A",
                "icon": "apple",
                "description_en": "Kitchen food scraps, vegetable peels, leftovers, tea grounds and perishable organic matter.",
                "description_ml": "അടുക്കള ഭക്ഷണാവശിഷ്ടങ്ങൾ, പച്ചക്കറി തൊലികൾ, ചായപ്പൊടി, കേടുവരുന്ന ജൈവ വസ്തുക്കൾ.",
                "is_scrap_eligible": False,
                "order": 1,
                "guide": {
                    "what_it_is_en": "Biodegradable organic matter from cooking and eating.",
                    "what_it_is_ml": "പാചകത്തിൽ നിന്നും ഭക്ഷണത്തിൽ നിന്നുമുള്ള അഴുകുന്ന ജൈവ അവശിഷ്ടങ്ങൾ.",
                    "dos_en": ["Drain all liquids before bagging", "Use green aerated bins or home composters", "Keep separate from plastics and wrappers"],
                    "dos_ml": ["വെള്ളം പൂർണ്ണമായി വാർത്തെടുക്കുക", "പച്ച ബിന്നിലോ കമ്പോസ്റ്ററിലോ ഇടുക", "പ്ലാസ്റ്റിക് കവറുകൾ കലർത്തരുത്"],
                    "donts_en": ["Do not throw in plastic carry bags", "Do not mix chemical cleaners or medicines"],
                    "donts_ml": ["പ്ലാസ്റ്റിക് കവറുകളിലാക്കി വലിച്ചെറിയരുത്", "രാസവസ്തുക്കളോ മരുന്നുകളോ ചേർക്കരുത്"],
                    "who_collects_en": "Haritha Karma Sena / Clean Loop daily morning fleet",
                    "who_collects_ml": "ഹരിത കർമ്മ സേന / ക്ലീൻ ലൂപ്പ് രാവിലെ ശേഖരണം",
                    "how_to_prepare_en": "Keep covered in an aerated container with paper lining to prevent foul smell.",
                    "how_to_prepare_ml": "ദുർഗന്ധം ഒഴിവാക്കാൻ വായുസഞ്ചാരമുള്ള പാത്രത്തിൽ പേപ്പർ വിരിച്ച് അടച്ചു സൂക്ഷിക്കുക."
                }
            },
            {
                "slug": "dry_recyclable",
                "name_en": "Dry Recyclable Waste",
                "name_ml": "ഉണങ്ങിയ പുനരുപയോഗ മാലിന്യം",
                "bin_color_en": "Blue Bin",
                "bin_color_ml": "നീല ബിൻ",
                "color_hex": "#0284C7",
                "icon": "box",
                "description_en": "Clean paper, cardboard boxes, clean plastics, beverage cartons and containers.",
                "description_ml": "വൃത്തിയുള്ള പേപ്പർ, കാർഡ്ബോർഡ്, പ്ലാസ്റ്റിക്, പാനീയ പാക്കറ്റുകൾ.",
                "is_scrap_eligible": True,
                "order": 2,
                "guide": {
                    "what_it_is_en": "Non-biodegradable items that can be shredded, pulped or melted into new raw materials.",
                    "what_it_is_ml": "പുനരുപയോഗ യോഗ്യമായ നനവില്ലാത്ത വസ്തുക്കൾ.",
                    "dos_en": ["Rinse food residues thoroughly", "Flatten cartons and crush bottles", "Keep strictly dry"],
                    "dos_ml": ["ഭക്ഷണ അവശിഷ്ടങ്ങൾ കഴുകി കളയുക", "ബോക്സുകളും കുപ്പികളും പരത്തി സൂക്ഷിക്കുക", "നനവില്ലാതെ ഉണക്കി വെക്കുക"],
                    "donts_en": ["Do not mix oily or food-contaminated paper", "Do not mix wet kitchen waste"],
                    "donts_ml": ["എണ്ണ പുരണ്ട കടലാസുകൾ ഇടരുത്", "നനഞ്ഞ അവശിഷ്ടങ്ങൾ കലർത്തരുത്"],
                    "who_collects_en": "Clean Loop doorstep pickup / Scrap collection agents",
                    "who_collects_ml": "ക്ലീൻ ലൂപ്പ് വീട്ടുപടിക്കൽ ശേഖരണം / ആക്രി ഏജന്റുകൾ",
                    "how_to_prepare_en": "Wash with leftover rinse water, air dry in balcony, pack into paper sack.",
                    "how_to_prepare_ml": "കഴുകി ഉണക്കി ചാക്കിലോ പേപ്പർ ബാഗിലോ സൂക്ഷിക്കുക."
                }
            },
            {
                "slug": "plastic",
                "name_en": "Plastic & Packaging",
                "name_ml": "പ്ലാസ്റ്റിക് & പാക്കേജിംഗ്",
                "bin_color_en": "Blue Bin (Designated Plastic Bag)",
                "bin_color_ml": "നീല ബിൻ (പ്ലാസ്റ്റിക് ബാഗ്)",
                "color_hex": "#0D9488",
                "icon": "package",
                "description_en": "Milk packets, grocery bags, oil covers, shampoo bottles, PET drink bottles.",
                "description_ml": "പാൽ കവറുകൾ, എണ്ണ കവറുകൾ, ഷാംപൂ കുപ്പികൾ, പെറ്റ് കുപ്പികൾ.",
                "is_scrap_eligible": True,
                "order": 3,
                "guide": {
                    "what_it_is_en": "Thermoplastics and packaging films recyclable in Kerala recycling units.",
                    "what_it_is_ml": "പുനരുപയോഗിക്കാൻ കഴിയുന്ന വിവിധയിനം പ്ലാസ്റ്റിക് കവറുകളും കുപ്പികളും.",
                    "dos_en": ["Wash milk and oil pouches with soap water", "Dry completely on clothesline", "Bundle similar plastics"],
                    "dos_ml": ["പാൽ, എണ്ണ കവറുകൾ കഴുകി ഉണക്കുക", "ഒരേ തരം പ്ലാസ്റ്റിക്കുകൾ ഒരുമിച്ച് കെട്ടുക"],
                    "donts_en": ["Never burn plastic waste (Kerala fine up to ₹50,000)", "Do not mix wet dirt"],
                    "donts_ml": ["പ്ലാസ്റ്റിക് ഒരു കാരണവശാലും കത്തിക്കരുത് (പിഴ ₹50,000 വരെ)", "ചളി കലർത്തരുത്"],
                    "who_collects_en": "Haritha Karma Sena (Monthly designated day) & Clean Loop Scrap",
                    "who_collects_ml": "ഹരിത കർമ്മ സേന & ക്ലീൻ ലൂപ്പ് ആക്രി പിക്കപ്പ്",
                    "how_to_prepare_en": "Cut milk packets along the corner, wash inside, dry, and collect in a dedicated bag.",
                    "how_to_prepare_ml": "പാൽ കവർ കഴുകി ഉണക്കി പ്രത്യേകം ശേഖരിക്കുക."
                }
            },
            {
                "slug": "glass",
                "name_en": "Glass Bottles & Jars",
                "name_ml": "ഗ്ലാസ് കുപ്പികൾ & ഭരണികൾ",
                "bin_color_en": "Cardboard Box / Yellow Bin",
                "bin_color_ml": "മഞ്ഞ ബിൻ / കാർഡ്ബോർഡ് പെട്ടി",
                "color_hex": "#6366F1",
                "icon": "wine",
                "description_en": "Pickle jars, beverage bottles, cosmetic glass containers (unbroken).",
                "description_ml": "അച്ചാർ കുപ്പികൾ, സോഡാ കുപ്പികൾ, കേടുപാടില്ലാത്ത ഗ്ലാസ് ജാറുകൾ.",
                "is_scrap_eligible": True,
                "order": 4,
                "guide": {
                    "what_it_is_en": "100% infinitely recyclable silica-based containers.",
                    "what_it_is_ml": "പൂർണ്ണമായി പുനരുപയോഗിക്കാവുന്ന ഗ്ലാസ് പാത്രങ്ങൾ.",
                    "dos_en": ["Rinse clean", "Remove metal caps or plastic seals", "Pack safely to avoid breakage"],
                    "dos_ml": ["കഴുകി വൃത്തിയാക്കുക", "അടപ്പുകൾ മാറ്റുക", "പൊട്ടാതെ സുരക്ഷിതമായി സൂക്ഷിക്കുക"],
                    "donts_en": ["Do not mix broken tube lights, mirrors or ceramics here", "Do not shatter intentionally"],
                    "donts_ml": ["ട്യൂബ്‌ലൈറ്റ്, കണ്ണാടി, സെറാമിക് എന്നിവ ഇതിൽ കലർത്തരുത്"],
                    "who_collects_en": "Clean Loop scrap agents / Monthly Haritha Karma Sena drive",
                    "who_collects_ml": "ക്ലീൻ ലൂപ്പ് ഏജന്റുകൾ / ഹരിത കർമ്മ സേന",
                    "how_to_prepare_en": "Rinse, dry, and keep upright in a padded box.",
                    "how_to_prepare_ml": "കഴുകി ബോക്സിൽ സൂക്ഷിക്കുക."
                }
            },
            {
                "slug": "e_waste",
                "name_en": "Electronic Waste (E-Waste)",
                "name_ml": "ഇ-വേസ്റ്റ് (ഇലക്ട്രോണിക് അവശിഷ്ടങ്ങൾ)",
                "bin_color_en": "Red / Designated E-Bin",
                "bin_color_ml": "ചുവപ്പ് / പ്രത്യേക ഇ-ബിൻ",
                "color_hex": "#DC2626",
                "icon": "cpu",
                "description_en": "Old phones, chargers, copper wires, cables, keyboards, printed circuit boards (PCBs).",
                "description_ml": "പഴയ ഫോണുകൾ, ചാർജറുകൾ, ചെമ്പ് വയറുകൾ, കീബോർഡുകൾ, സർക്യൂട്ട് ബോർഡുകൾ.",
                "is_scrap_eligible": True,
                "order": 5,
                "guide": {
                    "what_it_is_en": "Discarded electronic equipment containing valuable metals and toxic circuitry.",
                    "what_it_is_ml": "വിലപിടിപ്പുള്ള ലോഹങ്ങളും സർക്യൂട്ടുകളും അടങ്ങിയ ഇലക്ട്രോണിക് സാധനങ്ങൾ.",
                    "dos_en": ["Store in a dry cool room", "Book a Clean Loop scrap pickup for high payouts on copper & boards"],
                    "dos_ml": ["നനവില്ലാത്ത സ്ഥലത്ത് സൂക്ഷിക്കുക", "നല്ല വില ലഭിക്കാൻ ക്ലീൻ ലൂപ്പിൽ വിൽക്കുക"],
                    "donts_en": ["Never smash open CRT monitors or battery cells", "Do not throw with regular trash"],
                    "donts_ml": ["ബാറ്ററിയോ സ്ക്രീനുകളോ അടിച്ചുപൊട്ടിക്കരുത്", "സാധാരണ ചവറ്റുകുട്ടയിൽ ഇടരുത്"],
                    "who_collects_en": "Clean Loop Certified E-Waste collectors & Scrap Agents",
                    "who_collects_ml": "ക്ലീൻ ലൂപ്പ് അംഗീകൃത ഇ-മാലിന്യ ഏജന്റുകൾ",
                    "how_to_prepare_en": "Keep cables bundled with rubber bands and wrap fragile electronics.",
                    "how_to_prepare_ml": "വയറുകൾ ചുരുട്ടി ഭദ്രമായി സൂക്ഷിക്കുക."
                }
            },
            {
                "slug": "hazardous",
                "name_en": "Hazardous Domestic Waste",
                "name_ml": "അപകടകരമായ ഗാർഹിക മാലിന്യങ്ങൾ",
                "bin_color_en": "Red Bin",
                "bin_color_ml": "ചുവപ്പ് ബിൻ",
                "color_hex": "#B91C1C",
                "icon": "alert-triangle",
                "description_en": "Paints, pesticides, thinners, chemical cleaners, mercury thermometers, expired medicines.",
                "description_ml": "പെയിന്റുകൾ, കീടനാശിനികൾ, തിന്നർ, മെർക്കുറി തെർമോമീറ്റർ, കാലാവധി കഴിഞ്ഞ മരുന്നുകൾ.",
                "is_scrap_eligible": False,
                "order": 6,
                "guide": {
                    "what_it_is_en": "Toxic, inflammable, or corrosive household chemicals.",
                    "what_it_is_ml": "വിഷലിപ്തമോ തീപിടിക്കുന്നതോ ആയ രാസവസ്തുക്കൾ.",
                    "dos_en": ["Keep tightly closed in original bottles with labels intact", "Keep away from children and pets"],
                    "dos_ml": ["കുപ്പികൾ ഭദ്രമായി അടച്ചു സൂക്ഷിക്കുക", "കുട്ടികൾക്ക് കിട്ടാത്ത സ്ഥലത്ത് വെക്കുക"],
                    "donts_en": ["Never pour down storm drains or backwaters in Kochi", "Do not incinerate"],
                    "donts_ml": ["കായലിലോ കാനകളിലോ ഒഴുക്കരുത്", "തീയിടരുത്"],
                    "who_collects_en": "Kochi Municipal Corporation Hazardous Special Drives",
                    "who_collects_ml": "കൊച്ചി കോർപ്പറേഷൻ പ്രത്യേക ഡ്രൈവുകൾ",
                    "how_to_prepare_en": "Seal in a leak-proof container and hand over on notified municipal drive days.",
                    "how_to_prepare_ml": "ചോർച്ചയില്ലാത്ത പാത്രത്തിൽ അടച്ച് സൂക്ഷിക്കുക."
                }
            },
            {
                "slug": "biomedical_sanitary",
                "name_en": "Sanitary & Biomedical Waste",
                "name_ml": "സാനിറ്ററി & ബയോമെഡിക്കൽ മാലിന്യം",
                "bin_color_en": "Yellow / Red Leakproof Bag (Marked with Red Cross)",
                "bin_color_ml": "ചുവന്ന അടയാളമുള്ള മഞ്ഞ ബാഗ്",
                "color_hex": "#E11D48",
                "icon": "shield-alert",
                "description_en": "Sanitary napkins, baby diapers, adult pads, bandages, medical cotton.",
                "description_ml": "സാനിറ്ററി നാപ്കിനുകൾ, ഡയപ്പറുകൾ, ബാൻഡേജുകൾ, മെഡിക്കൽ കോട്ടൺ.",
                "is_scrap_eligible": False,
                "order": 7,
                "guide": {
                    "what_it_is_en": "Potentially infectious human hygiene waste.",
                    "what_it_is_ml": "അണുബാധയ്ക്ക് സാധ്യതയുള്ള ശുചിത്വ മാലിന്യങ്ങൾ.",
                    "dos_en": ["Wrap in newspaper and mark with red ink 'X'", "Use bio-degradable sanitary disposal pouches"],
                    "dos_ml": ["പത്രക്കടലാസിൽ പൊതിഞ്ഞ് ചുവന്ന 'X' അടയാളം ഇടുക"],
                    "donts_en": ["Do not flush down toilets (leads to Kochi drain blockages)", "Do not mix with dry recyclables"],
                    "donts_ml": ["ക്ലോസറ്റിൽ ഫ്ലഷ് ചെയ്യരുത് (കാനകൾ അടയും)", "മറ്റ് മാലിന്യങ്ങളുമായി കലർത്തരുത്"],
                    "who_collects_en": "IMAGE (IMA Biomedical disposal network) & Special Municipal vehicle",
                    "who_collects_ml": "ഇമേജ് (IMAGE) & നഗരസഭ പ്രത്യേക വാഹനം",
                    "how_to_prepare_en": "Roll tightly, wrap with newspaper, seal with tape, and hand over separately.",
                    "how_to_prepare_ml": "പത്രത്തിൽ ഭദ്രമായി പൊതിഞ്ഞ് പ്രത്യേകമായി കൈമാറുക."
                }
            },
            {
                "slug": "garden_waste",
                "name_en": "Garden Waste & Coconut Shells",
                "name_ml": "തോട്ടം മാലിന്യങ്ങൾ & ചിരട്ട / തൊണ്ട്",
                "bin_color_en": "Brown Bin / Gunny Sack",
                "bin_color_ml": "തവിട്ട് ബിൻ / ചാക്ക്",
                "color_hex": "#854D0E",
                "icon": "leaf",
                "description_en": "Pruned branches, dried leaves, coconut husks (ചകിരി), shells (ചിരട്ട), grass clippings.",
                "description_ml": "ഉണങ്ങിയ ഇലകൾ, വെട്ടിയ മരച്ചില്ലകൾ, ചകിരി, ചിരട്ട, പുല്ല്.",
                "is_scrap_eligible": True,
                "order": 8,
                "guide": {
                    "what_it_is_en": "Fibrous biomass suitable for mulching, coir making, or high-value coconut shell charcoal.",
                    "what_it_is_ml": "കമ്പോസ്റ്റിംഗിനും കയർ നിർമ്മാണത്തിനും ഉതകുന്ന ജൈവ വസ്തുക്കൾ.",
                    "dos_en": ["Use as soil mulch or home compost base", "Save coconut shells to sell to bio-charcoal collectors"],
                    "dos_ml": ["മണ്ണിൽ പുതയിടാനോ കമ്പോസ്റ്റിനോ ഉപയോഗിക്കുക", "ചിരട്ട പ്രത്യേകം ശേഖരിച്ച് വിൽക്കുക"],
                    "donts_en": ["Never burn leaves in open yards (violates Kerala Air Quality bye-laws)", "Do not clog drains"],
                    "donts_ml": ["മുറ്റത്തിട്ട് കത്തിക്കരുത് (നിയമവിരുദ്ധമാണ്)"],
                    "who_collects_en": "Clean Loop on-demand bulk pickup & Kerala LSGD biomass units",
                    "who_collects_ml": "ക്ലീൻ ലൂപ്പ് ബൾക്ക് പിക്കപ്പ്",
                    "how_to_prepare_en": "Chop long branches into 2-foot bundles and tie securely.",
                    "how_to_prepare_ml": "ചില്ലകൾ ചെറിയ കെട്ടുകളാക്കി ചാക്കിലാക്കുക."
                }
            }
        ]

        for cat_data in categories_data:
            guide_data = cat_data.pop('guide')
            cat, _ = WasteCategory.objects.get_or_create(slug=cat_data['slug'], defaults=cat_data)
            DisposalGuide.objects.get_or_create(category=cat, defaults=guide_data)

        # 5. Seed 22 Engaging Facts (Kerala + India)
        facts_data = [
            ("kerala", "Kerala generates approximately 10,700 tonnes of municipal solid waste every single day.", "കേരളത്തിൽ പ്രതിദിനം ഏകദേശം 10,700 ടൺ ഖരമാലിന്യം ഉത്പാദിപ്പിക്കപ്പെടുന്നു.", "Kerala Suchitwa Mission 2024 Report"),
            ("kerala", "Kochi Municipal Corporation area produces nearly 300+ tonnes of waste daily, of which over 65% is organic wet waste.", "കൊച്ചി കോർപ്പറേഷൻ പരിധിയിൽ പ്രതിദിനം 300-ലധികം ടൺ മാലിന്യം ഉണ്ടാകുന്നു; ഇതിൽ 65 ശതമാനവും ജൈവമാലിന്യമാണ്.", "KMC Waste Audit"),
            ("kerala", "Haritha Karma Sena women self-help groups collect non-biodegradable waste from over 85% of Kochi households.", "കൊച്ചിയിലെ 85% വീടുകളിൽ നിന്നും അജൈവ മാലിന്യങ്ങൾ ശേഖരിക്കുന്നത് ഹരിത കർമ്മ സേനയിലെ വനിതകളാണ്.", "Kudumbashree Mission Kerala"),
            ("kerala", "Over 90% of plastic marine litter washing up on Fort Kochi beach originates from uncollected inland storm drains.", "ഫോർട്ട് കൊച്ചി കടൽത്തീരത്ത് അടിയുന്ന 90% പ്ലാസ്റ്റിക്കും നഗരത്തിലെ തോടുകളിൽ നിന്നും കാനകളിൽ നിന്നും എത്തുന്നതാണ്.", "CUSAT Marine Science Study"),
            ("recycling", "Recycling a single aluminium can saves enough electricity to run a ceiling fan for nearly 4 hours.", "ഒരു അലുമിനിയം ക്യാൻ പുനരുപയോഗിച്ചാൽ ഒരു ഫാൻ 4 മണിക്കൂർ പ്രവർത്തിപ്പിക്കാനുള്ള വൈദ്യുതി ലാഭിക്കാം.", "International Aluminium Institute"),
            ("recycling", "Clean copper wire is one of the most profitable scrap commodities in Kerala, fetching up to ₹420 per kilogram.", "ചെമ്പ് കമ്പികൾക്ക് കിലോഗ്രാമിന് ₹420 വരെ ലഭിക്കുന്ന കേരളത്തിലെ ഏറ്റവും ഉയർന്ന വിലയുള്ള ആക്രി വസ്തുവാണ്.", "Kerala Scrap Merchant Trade Union"),
            ("plastic", "Single-use plastic takes up to 450 years to decompose in Kerala's humid coastal climate, breaking into microplastics.", "ഒരു പ്ലാസ്റ്റിക് കവർ കേരളത്തിലെ മണ്ണിൽ നശിക്കാൻ 450 വർഷത്തോളമെടുക്കും; ഇത് സൂക്ഷ്മ പ്ലാസ്റ്റിക്കായി മാറും.", "Central Pollution Control Board"),
            ("organic", "Composting kitchen waste at home prevents methane emissions 25 times more potent than carbon dioxide in landfills.", "വീടുകളിൽ തന്നെ ജൈവമാലിന്യം കമ്പോസ്റ്റ് ചെയ്യുന്നത് വായുമലിനീകരണം ഗണ്യമായി കുറയ്ക്കുന്നു.", "United Nations UNEP"),
            ("india", "India recycles nearly 60% of its PET plastic bottles, primarily driven by informal scrap collectors (Kabadiwalas).", "ഇന്ത്യയിലെ 60% പെറ്റ് കുപ്പികളും ആക്രി ശേഖരണ ശൃംഖല വഴി പുനരുപയോഗിക്കപ്പെടുന്നു.", "NITI Aayog Circular Economy Report"),
            ("kerala", "Brahmapuram legacy waste biomining in Kochi is processing over 5 lakh cubic meters of accumulated refuse.", "ബ്രഹ്മപുരത്തെ ലെഗസി വേസ്റ്റ് ബയോമൈനിംഗ് വഴി ലക്ഷക്കണക്കിന് ക്യുബിക് മീറ്റർ മാലിന്യം പുനരുപയോഗ യോഗ്യമാക്കുന്നു.", "Suchitwa Mission Action Plan"),
            ("recycling", "Recycling one tonne of cardboard boxes saves 17 mature trees and 7,000 gallons of fresh water.", "ഒരു ടൺ കാർഡ്ബോർഡ് പുനരുപയോഗിക്കുന്നത് 17 മരങ്ങളും 7,000 ഗാലൻ ശുദ്ധജലവും സംരക്ഷിക്കുന്നു.", "Bureau of International Recycling"),
            ("kerala", "Burning dry leaves with plastics releases deadly dioxins and furans, triggering severe respiratory issues.", "ഉണങ്ങിയ ഇലകളും പ്ലാസ്റ്റിക്കും കത്തിക്കുന്നത് മാരകമായ വിഷവാതകങ്ങൾ അന്തരീക്ഷത്തിൽ പടർത്തുന്നു.", "Kerala State Pollution Control Board"),
            ("plastic", "Kerala was one of the earliest Indian states to enforce a comprehensive ban on single-use carry bags and thermocol.", "സിംഗിൾ-യൂസ് പ്ലാസ്റ്റിക് കവറുകൾ നിരോധിച്ച ഇന്ത്യയിലെ ആദ്യ സംസ്ഥാനങ്ങളിലൊന്നാണ് കേരളം.", "Kerala Environment Dept"),
            ("e_waste", "One metric tonne of circuit boards (PCBs) contains 40 to 800 times more gold than a metric tonne of natural gold ore.", "ഒരു ടൺ കമ്പ്യൂട്ടർ സർക്യൂട്ട് ബോർഡുകളിൽ പ്രകൃതിദത്ത സ്വർണ്ണ ഖനിയേക്കാൾ കൂടുതൽ സ്വർണ്ണാംശം അടങ്ങിയിട്ടുണ്ട്.", "United Nations E-Waste Monitor"),
            ("kerala", "Thrikkakara and Kakkanad IT corridors produce the highest per-capita cardboard and online packaging waste in Ernakulam.", "എറണാകുളത്ത് ഏറ്റവും കൂടുതൽ ഓൺലൈൻ പാക്കേജിംഗ് മാലിന്യം ഉണ്ടാകുന്നത് കാക്കനാട് ഐടി മേഖലയിലാണ്.", "Ernakulam District Planning Committee"),
            ("recycling", "Glass containers can be recycled endlessly with zero loss in quality or chemical purity.", "ഗ്ലാസ് കുപ്പികൾ ഗുണനിലവാരം ഒട്ടും നഷ്ടപ്പെടാതെ എത്ര തവണ വേണമെങ്കിലും പുനരുപയോഗിക്കാം.", "Glass Packaging Institute"),
            ("organic", "Black soldier fly larvae (BSFL) composting can convert 100kg of food waste into organic protein within 24 hours.", "ബിഎസ്എഫ് ലാർവകൾ ഉപയോഗിച്ച് 24 മണിക്കൂറിനുള്ളിൽ ഭക്ഷണാവശിഷ്ടങ്ങൾ കമ്പോസ്റ്റാക്കി മാറ്റാം.", "Kerala Agricultural University"),
            ("india", "India generates 3.4 million tonnes of plastic waste annually, with per-capita generation rising 2.2x over a decade.", "ഇന്ത്യയിൽ പ്രതിവർഷം 3.4 ദശലക്ഷം ടൺ പ്ലാസ്റ്റിക് മാലിന്യം ഉണ്ടാകുന്നു.", "MoEFCC Annual Statistics"),
            ("kerala", "Kochi Water Metro ferries run on battery power and maintain zero-waste discharge into the Vembanad backwaters.", "കൊച്ചി വാട്ടർ മെട്രോ വേമ്പനാട്ടു കായലിലേക്ക് ഒരു മാലിന്യവും തള്ളാതെയാണ് സർവീസ് നടത്തുന്നത്.", "KMRL Kochi Water Metro"),
            ("recycling", "Re-refining used automotive engine oil takes only 30% of the energy required to refine crude oil from wells.", "പഴയ എഞ്ചിൻ ഓയിൽ പുനരുപയോഗിക്കുന്നത് ക്രൂഡ് ഓയിൽ ശുദ്ധീകരിക്കുന്നതിനേക്കാൾ 70% ഊർജ്ജം ലാഭിക്കുന്നു.", "Petroleum Conservation Research Assoc"),
            ("kerala", "Alappuzha's decentralized home-composting model won global recognition from the United Nations Environment Programme.", "ആലപ്പുഴയുടെ വികേന്ദ്രീകൃത മാലിന്യ സംസ്കരണ മാതൃക ഐക്യരാഷ്ട്രസഭയുടെ പ്രശംസ നേടിയിട്ടുണ്ട്.", "UNEP Clean Seas Award"),
            ("india", "Over 1.5 million people in India make their livelihoods through door-to-door scrap and recyclable collection.", "ഇന്ത്യയിലെ 15 ലക്ഷത്തിലധികം ആളുകൾ ആക്രി ശേഖരണത്തിലൂടെ ഉപജീവനം കണ്ടെത്തുന്നു.", "Chintan Environmental Research")
        ]

        for i, (tag, f_en, f_ml, src) in enumerate(facts_data):
            Fact.objects.get_or_create(
                fact_en=f_en,
                defaults={
                    'tag': tag,
                    'fact_ml': f_ml,
                    'source_en': src,
                    'source_ml': src,
                    'order': i + 1,
                    'is_active': True
                }
            )

        # 6. Seed 21 Practical Tips
        tips_data = [
            ("segregation", "The Two-Bin, One-Bag Rule", "രണ്ട് ബിൻ, ഒരു ബാഗ് രീതി", "Keep Green bin for food waste, Blue bin for dry waste, and a hanging fabric bag for clean milk & oil pouches.", "ഭക്ഷണാവശിഷ്ടങ്ങൾക്ക് പച്ച ബിൻ, ഉണങ്ങിയതിന് നീല ബിൻ, കഴുകിയ പാൽ കവറുകൾക്ക് തുണിസഞ്ചി എന്നിവ സൂക്ഷിക്കുക.", True),
            ("kitchen", "Drain Food Scraps Completely", "ഭക്ഷണ മാലിന്യത്തിലെ വെള്ളം വാർത്തെടുക്കുക", "Moisture causes foul odors and flies. Squeeze gravy and tea leaves before dropping in the organic bin.", "നനവാണ് ദുർഗന്ധത്തിന് കാരണം. വെള്ളം വാർത്തെടുത്ത ശേഷം മാത്രം ബിന്നിലിടുക.", False),
            ("reduction", "Carry Kasavu or Cotton Tote Bags", "തുണിസഞ്ചി ശീലമാക്കുക", "Keep a reusable canvas bag in your scooter boot or backpack when heading to Kochi supermarkets.", "സൂപ്പർമാർക്കറ്റിൽ പോകുമ്പോൾ തുണിസഞ്ചി കയ്യിൽ കരുതുന്നത് പ്ലാസ്റ്റിക് ഒഴിവാക്കും.", False),
            ("reuse", "Give Cardboard Boxes a Second Life", "കാർഡ്ബോർഡ് ബോക്സുകൾ പുനരുപയോഗിക്കുക", "Store online delivery boxes flat. When you reach 10kg, request Clean Loop doorstep pickup to earn cash.", "ഓൺലൈൻ ഓർഡർ ബോക്സുകൾ ശേഖരിച്ച് വെച്ച് ക്ലീൻ ലൂപ്പ് വഴി വിറ്റ് പണം സമ്പാദിക്കുക.", False),
            ("composting", "Ring Composters for Kerala Yards", "മുറ്റത്ത് റിംഗ് കമ്പോസ്റ്റർ സ്ഥാപിക്കുക", "Use a 2-tier concrete ring composter. Sprinkle sawdust or dry leaves to maintain optimal carbon-nitrogen balance.", "ഭക്ഷണാവശിഷ്ടങ്ങൾ കമ്പോസ്റ്റാക്കാൻ കോൺക്രീറ്റ് റിംഗുകൾ ഉപയോഗിക്കാം; ഉണങ്ങിയ ഇലകൾ ചേർത്തുകൊടുക്കുക.", False),
            ("segregation", "Wash & Snip Milk Pouches Corner-to-Corner", "പാൽ കവറുകൾ കഴുകി സൂക്ഷിക്കുക", "Do not cut small triangle corners off milk packets—they escape sorting machines and choke ocean fish.", "പാൽ കവറിന്റെ മൂല വെട്ടിമാറ്റാതെ അറ്റം മാത്രം തുറക്കുക; മുഴുവനായി കഴുകി ഉണക്കുക.", False),
            ("reduction", "Refill Clean Water in Steel Flasks", "സ്റ്റീൽ കുപ്പികൾ ഉപയോഗിക്കുക", "Avoid buying single-use bottled water at Kochi Metro stations; use free RO refill stations.", "യാത്രകളിൽ സ്റ്റീൽ കുപ്പി കരുതുക; ഒറ്റത്തവണ പ്ലാസ്റ്റിക് കുപ്പികൾ ഒഴിവാക്കാം.", False),
            ("kitchen", "Citrus Peels Make Great Bio-Enzyme Cleaners", "നാരങ്ങാത്തോട് കൊണ്ട് ജൈവ ക്ലീനർ ഉണ്ടാക്കാം", "Ferment lemon and orange peels with jaggery and water for 90 days to create a pleasant floor disinfectant.", "നാരങ്ങാത്തോടും ശർക്കരയും ചേർത്ത് സ്വാഭാവിക ക്ലീനിംഗ് ലോഷൻ ഉണ്ടാക്കാം.", False),
            ("segregation", "E-Waste Safety: Tape Battery Terminals", "ബാറ്ററികൾ സൂക്ഷിക്കുമ്പോൾ ശ്രദ്ധിക്കുക", "Tape 9V and lithium battery contacts with cello-tape to prevent accidental short circuits and fire hazards.", "ബാറ്ററിയുടെ അഗ്രങ്ങളിൽ ടേപ്പ് ഒട്ടിക്കുന്നത് ഷോർട്ട് സർക്യൂട്ട് ഒഴിവാക്കും.", False),
            ("reduction", "Opt for Zero-Waste Banana Leaves at Feeds", "സദ്യകൾക്ക് വാഴയില ഉപയോഗിക്കുക", "Traditional Kerala banana leaf dining is 100% biodegradable and enriches backyard soil when composted.", "പ്ലാസ്റ്റിക് പ്ലേറ്റുകൾക്ക് പകരം വാഴയില ഉപയോഗിക്കുന്നത് പ്രകൃതിക്ക് ഏറ്റവും അനുയോജ്യമാണ്.", False),
            ("reuse", "Glass Jars for Pantry Storage", "ഗ്ലാസ് കുപ്പികൾ അടുക്കളയിൽ ഉപയോഗിക്കാം", "Reuse Horlicks and jam glass jars for pulses, pepper and spices instead of purchasing plastic containers.", "പഴയ ഗ്ലാസ് കുപ്പികൾ മസാലകളും പലവ്യഞ്ജനങ്ങളും സൂക്ഷിക്കാൻ ഉപയോഗിക്കാം.", False),
            ("composting", "Bio-Bins for Kochi Apartments", "ഫ്ലാറ്റുകളിൽ ബയോ-ബിൻ കമ്പോസ്റ്റിംഗ്", "Apartment residents can use innoculated cocopeat bio-bins that compost daily wet waste without any odor.", "ഫ്ലാറ്റുകളിൽ കൊക്കോപീറ്റ് ചേർത്ത ബയോ-ബിന്നുകൾ വഴി ദുർഗന്ധമില്ലാതെ കമ്പോസ്റ്റ് ചെയ്യാം.", False),
            ("segregation", "Never Put Sanitary Waste in Blue/Green Bins", "സാനിറ്ററി മാലിന്യം പ്രത്യേകം നൽകുക", "Wrap sanitary items in old newspaper with a marked red 'X' and hand over directly to municipal operators.", "സാനിറ്ററി മാലിന്യങ്ങൾ പേപ്പറിൽ പൊതിഞ്ഞ് അടയാളമിട്ട് പ്രത്യേകം കൈമാറുക.", False),
            ("reduction", "Cloth Diapering for Infants", "കുഞ്ഞുങ്ങൾക്ക് തുണി ഡയപ്പറുകൾ ശീലമാക്കാം", "Modern washable pocket cloth diapers save up to 4,000 disposable plastic diapers from clogging local dumps.", "കഴുകി ഉപയോഗിക്കാവുന്ന തുണി ഡയപ്പറുകൾ ടൺ കണക്കിന് പ്ലാസ്റ്റിക് ഒഴിവാക്കും.", False),
            ("reuse", "Scrap Coconut Shells for High Value Charcoal", "ചിരട്ടകൾ മാറ്റിവെക്കുക", "Do not discard coconut shells; clean dry shells can be sold to activated carbon manufacturing units in Kerala.", "ചിരട്ടകൾ ആക്രിയായി വിറ്റാൽ അധികവരുമാനം നേടാം.", False),
            ("kitchen", "Freeze Seafood Waste Until Collection Day", "മത്സ്യ അവശിഷ്ടങ്ങൾ ഫ്രീസറിൽ സൂക്ഷിക്കുക", "Wrap fish heads and prawn shells in newspaper and freeze until collection morning to prevent cat scavengers.", "മീൻ വേസ്റ്റ് പിക്കപ്പ് ദിവസം വരെ ഫ്രീസറിൽ വെക്കുന്നത് പൂച്ചകളും പുഴുക്കളും വരുന്നത് തടയും.", False),
            ("segregation", "Crush PET Bottles After Use", "പ്ലാസ്റ്റിക് കുപ്പികൾ ചവിട്ടി പരത്തുക", "Crushing empty bottles expels air, cutting bin volume by 70% and easing transportation logistics.", "കുപ്പികൾ പരത്തി സൂക്ഷിച്ചാൽ ബിന്നിൽ സ്ഥലം ലാഭിക്കാം.", False),
            ("reduction", "Switch to Bamboo Toothbrushes", "മുള കൊണ്ടുള്ള ടൂത്ത് ബ്രഷ് ഉപയോഗിക്കുക", "Over 150 million plastic toothbrushes end up in Indian landfills yearly. Bamboo handles rot naturally in soil.", "പ്ലാസ്റ്റിക് ബ്രഷുകൾക്ക് പകരം മുള കൊണ്ടുള്ള ബ്രഷുകൾ പരീക്ഷിക്കുക.", False),
            ("reuse", "Donate Old Clothes for Upcycled Mat Weaving", "പഴയ തുണികൾ ചവിട്ടി നിർമ്മാണത്തിന് നൽകുക", "Give worn cotton shirts and sarees to Kudumbashree weavers who make durable floor rugs and mop clothes.", "പഴയ വസ്ത്രങ്ങൾ കുടുംബശ്രീയുടെ പുനരുപയോഗ യൂണിറ്റുകൾക്ക് നൽകാം.", False),
            ("segregation", "Separate Bottle Caps from Glass Bottles", "കുപ്പികളുടെ മൂടികൾ മാറ്റുക", "Metal crown corks and plastic screw caps belong to separate scrap streams from silica glass.", "കുപ്പിയുടെ ഇരുമ്പ് അടപ്പുകൾ വേർതിരിച്ച് നൽകുക.", False),
            ("reduction", "Say No to Plastic Straws and Stirrers", "പ്ലാസ്റ്റിക് സ്ട്രോകൾ വേണ്ടെന്ന് വെക്കുക", "Request drinks without plastic straws at Kochi cafes or carry a personal reusable steel straw.", "കഫേകളിൽ പ്ലാസ്റ്റിക് സ്ട്രോകൾ ഒഴിവാക്കാൻ ആവശ്യപ്പെടുക.", False)
        ]

        for i, (cat, t_en, t_ml, c_en, c_ml, is_today) in enumerate(tips_data):
            Tip.objects.get_or_create(
                title_en=t_en,
                defaults={
                    'category': cat,
                    'title_ml': t_ml,
                    'content_en': c_en,
                    'content_ml': c_ml,
                    'is_today_tip': is_today,
                    'order': i + 1,
                    'is_active': True
                }
            )

        # 7. Seed 16 Rules and Fines (Indicative Kochi / Kerala LSGD)
        rules_data = [
            ("open_dumping", "Dumping solid waste on public roads, footpaths, or vacant plots in Kochi Corporation limits.", "പൊതുവഴികളിലോ ആളൊഴിഞ്ഞ പറമ്പുകളിലോ മാലിന്യം വലിച്ചെറിയുന്നത്.", "₹5,000 to ₹10,000 fine + cleanup costs", "₹5,000 മുതൽ ₹10,000 വരെ പിഴയും ശുചീകരണച്ചെലവും", 5000, 10000, True),
            ("waterbody_dumping", "Throwing waste into canals, drains, Vembanad lake, or Kochi backwaters.", "തോടുകളിലോ കായലിലോ ജലാശയങ്ങളിലോ മാലിന്യം തള്ളുന്നത്.", "₹25,000 to ₹50,000 fine + Criminal prosecution under Kerala Irrigation and Water Conservation Act", "₹25,000 മുതൽ ₹50,000 വരെ പിഴയും നിയമ നടപടിയും", 25000, 50000, True),
            ("waste_burning", "Open burning of dry leaves, plastics, or domestic solid waste in premises.", "മുറ്റത്തോ പറമ്പിലോ പ്ലാസ്റ്റിക്കോ ഇലകളോ തീയിട്ട് കത്തിക്കുന്നത്.", "₹5,000 fine for first offense; ₹10,000 for repeated violations", "ആദ്യ തവണ ₹5,000; ആവർത്തിച്ചാൽ ₹10,000 പിഴ", 5000, 10000, True),
            ("plastic_ban", "Manufacture, stocking, sale, or distribution of banned single-use plastic carry bags (<120 microns).", "നിരോധിത ഒറ്റത്തവണ പ്ലാസ്റ്റിക് ക്യാരി ബാഗുകൾ വിൽക്കുകയോ സൂക്ഷിക്കുകയോ ചെയ്യുന്നത്.", "₹10,000 (1st offense), ₹25,000 (2nd), ₹50,000 + trade license cancellation (3rd)", "₹10,000 മുതൽ ₹50,000 വരെ പിഴയും ലൈസൻസ് റദ്ദാക്കലും", 10000, 50000, True),
            ("commercial", "Commercial establishments, restaurants, or hotels failing to segregate and process organic waste on-site.", "ഹോട്ടലുകളും കടകളും ജൈവമാലിന്യ സംസ്കരണ സംവിധാനം ഒരുക്കാതിരിക്കുന്നത്.", "₹10,000 to ₹25,000 + Closure notice by Municipal Health Officer", "₹10,000 മുതൽ ₹25,000 വരെ പിഴയും അടച്ചുപൂട്ടൽ നോട്ടീസും", 10000, 25000, True),
            ("biomedical", "Disposal of untreated clinical needles, syringes, or infectious biomedical waste with municipal garbage.", "ആശുപത്രി മാലിന്യങ്ങളും സിറിഞ്ചുകളും പൊതുമാലിന്യത്തിൽ കലർത്തുന്നത്.", "₹25,000 to ₹1,00,000 fine under Bio-Medical Waste Management Rules", "₹25,000 മുതൽ ₹1,00,000 വരെ പിഴ", 25000, 100000, True),
            ("construction", "Dumping concrete rubble, tiles, or construction debris on roadsides without permission.", "കെട്ടിടാവശിഷ്ടങ്ങളും കോൺക്രീറ്റ് മാലിന്യങ്ങളും വഴിയരികിൽ തള്ളുന്നത്.", "₹15,000 fine + vehicle confiscation", "₹15,000 പിഴയും വാഹനം പിടിച്ചെടുക്കലും", 15000, 15000, True),
            ("open_dumping", "Littering cigarette butts, plastic cups, or snack pouches in tourist spots (Marine Drive, Fort Kochi).", "മറൈൻ ഡ്രൈവ്, ഫോർട്ട് കൊച്ചി എന്നിവിടങ്ങളിൽ പ്ലാസ്റ്റിക് കുപ്പികളും മറ്റും വലിച്ചെറിയുന്നത്.", "Spot fine of ₹500 to ₹1,000 by Corporation Squads", "₹500 മുതൽ ₹1,000 വരെ സ്പോട്ട് ഫൈൻ", 500, 1000, True),
            ("e_waste", "Dismantling electronic monitors or burning lead-soldered circuit boards in residential areas.", "റെസിഡൻഷ്യൽ ഏരിയകളിൽ ഇ-മാലിന്യങ്ങൾ കത്തിക്കുകയോ തകർക്കുകയോ ചെയ്യുന്നത്.", "₹20,000 fine under E-Waste (Management) Rules", "₹20,000 പിഴ", 20000, 20000, True),
            ("commercial", "Bulk waste generators (>100 kg/day) failing to hand over recyclables to authorized recyclers.", "വൻകിട മാലിന്യ ഉത്പാദകർ അംഗീകൃത ഏജൻസികൾക്ക് മാലിന്യം കൈമാറാതിരിക്കുന്നത്.", "₹15,000 to ₹30,000 fine", "₹15,000 മുതൽ ₹30,000 വരെ പിഴ", 15000, 30000, True),
            ("waste_burning", "Burning tyres, insulated copper cables, or toxic synthetic foams.", "ടയറോ ചെമ്പ് വയറുകളോ പുകച്ച് കത്തിക്കുന്നത്.", "₹25,000 fine + non-bailable FIR under Air Pollution Control Act", "₹25,000 പിഴയും പോലീസിൽ കേസും", 25000, 25000, True),
            ("open_dumping", "Refusing to pay user fee to Haritha Karma Sena door-to-door waste collectors.", "ഹരിത കർമ്മ സേനയ്ക്ക് പ്രതിമാസ യൂസർ ഫീ നൽകാതിരിക്കുന്നത്.", "Holding of property tax clearance / building permits until arrears cleared", "യൂസർ ഫീ നൽകാത്തവർക്ക് നഗരസഭാ സേവനങ്ങൾക്ക് നിയന്ത്രണം", 50, 100, True),
            ("waterbody_dumping", "Dumping sewage or septage waste directly into public drains or lake water.", "സെപ്റ്റിക് ടാങ്ക് മാലിന്യം കായലിലോ തോട്ടിലോ ഒഴുക്കുന്നത്.", "₹50,000 fine + Permanent vehicle impoundment and arrest of driver", "₹50,000 പിഴയും വാഹനം കണ്ടുകെട്ടലും ഡ്രൈവറെ അറസ്റ്റ് ചെയ്യലും", 50000, 50000, True),
            ("plastic_ban", "Using non-woven polypropylene bags falsely advertised as 'cloth bags'.", "നോൺ-വോവൻ പ്ലാസ്റ്റിക് ബാഗുകൾ തുണിസഞ്ചിയെന്ന വ്യാജേന വിൽക്കുന്നത്.", "₹5,000 to ₹10,000 fine per retail shop", "കടകൾക്ക് ₹5,000 മുതൽ ₹10,000 വരെ പിഴ", 5000, 10000, True),
            ("biomedical", "Dumping unhygienic adult diapers or sanitary napkins in open community waste bins.", "സാനിറ്ററി പാഡുകളും ഡയപ്പറുകളും പൊതുവഴിയിൽ അലക്ഷ്യമായി വലിച്ചെറിയുന്നത്.", "₹3,000 to ₹5,000 fine", "₹3,000 മുതൽ ₹5,000 വരെ പിഴ", 3000, 5000, True),
            ("construction", "Failing to cover sand and building materials with tarpaulin during transit in Kochi city.", "കെട്ടിട നിർമ്മാണ സാമഗ്രികൾ മൂടിയില്ലാതെ നഗരത്തിൽ കൊണ്ടുപോകുന്നത്.", "₹2,500 fine per vehicle by Traffic Police / Municipal Squad", "വാഹനങ്ങൾക്ക് ₹2,500 പിഴ", 2500, 2500, True)
        ]

        for cat, r_en, r_ml, p_en, p_ml, p_min, p_max, verified in rules_data:
            RuleAndFine.objects.get_or_create(
                rule_en=r_en,
                defaults={
                    'category': cat,
                    'rule_ml': r_ml,
                    'penalty_en': p_en,
                    'penalty_ml': p_ml,
                    'penalty_amount_min': p_min,
                    'penalty_amount_max': p_max,
                    'needs_verification': verified,
                    'source_en': 'Kochi Municipal Corporation (KMC) Bye-laws & Kerala LSGD Gazette Notification (Indicative)',
                    'source_ml': 'കൊച്ചി കോർപ്പറേഷൻ ബൈലോ & തദ്ദേശ സ്വയംഭരണ വകുപ്പ് ഉത്തരവ് (സൂചക വിവരം)',
                    'is_active': True
                }
            )

        # 8. Seed Live Scrap Categories & Rate Card
        scrap_categories = [
            ("copper_wire", "Copper Wire & Coils", "ചെമ്പ് കമ്പികൾ", 420.00, "zap", "Stripped electric wires, AC copper pipes, motor windings.", "ഇലക്ട്രിക് വയറുകൾ, എസി കോപ്പർ പൈപ്പുകൾ.", 0.5, 1),
            ("brass_pithala", "Brass & Bronze (ഓട് / പിത്തള)", "പിത്തള & ഓട് പാത്രങ്ങൾ", 310.00, "utensils", "Old temple lamps (നിലവിളക്ക്), bronze cooking pots (ഉരുളി), taps.", "നിലവിളക്കുകൾ, പഴയ ഉരുളികൾ, പൈപ്പുകൾ.", 1.0, 2),
            ("aluminium", "Aluminium & Utensils", "അലുമിനിയം & പാത്രങ്ങൾ", 115.00, "layers", "Aluminium vessels, ladders, beverage cans, window frame extrusions.", "അലുമിനിയം പാത്രങ്ങൾ, ക്യാനുകൾ, ജനൽ ഫ്രെയിമുകൾ.", 1.0, 3),
            ("iron_steel", "Iron & Heavy Scrap Steel", "ഇരുമ്പ് & സ്റ്റീൽ", 28.50, "wrench", "Reinforcement rebar (കമ്പി), pipes, window grills, engine blocks.", "വാർക്കക്കമ്പികൾ, പൈപ്പുകൾ, ഗ്രില്ലുകൾ.", 5.0, 4),
            ("batteries_lead", "Car & Inverter Lead Batteries", "ഇൻവെർട്ടർ & കാർ ബാറ്ററികൾ", 78.00, "battery-charging", "Sealed lead acid UPS batteries, automotive vehicle batteries.", "ഇൻവെർട്ടർ ബാറ്ററികൾ, കാർ ബാറ്ററികൾ.", 5.0, 5),
            ("pcb_ewaste", "Computer CPUs & Motherboards", "കമ്പ്യൂട്ടർ സർക്യൂട്ട് ബോർഡുകൾ", 160.00, "cpu", "Desktop green PCBs, telecom equipment boards, server motherboards.", "മദർബോർഡുകൾ, സർക്യൂട്ട് പ്ലേറ്റുകൾ.", 1.0, 6),
            ("cardboard_kraft", "Corrugated Cardboard & Cartons", "കാർഡ്ബോർഡ് പെട്ടികൾ", 12.50, "package", "Clean brown Amazon/Flipkart shipping boxes, grocery packaging cartons.", "ആമസോൺ/ഫ്ലിപ്കാർട്ട് ഡെലിവറി ബോക്സുകൾ.", 3.0, 7),
            ("pet_bottles", "PET Clear Plastic Bottles", "പെറ്റ് പ്ലാസ്റ്റിക് കുപ്പികൾ", 16.00, "cylinder", "Crushed water and beverage bottles without caps.", "ശുദ്ധമായ പാനീയ കുപ്പികൾ.", 2.0, 8),
            ("newspaper_books", "Newspaper & Old Books (പഴയ കടലാസ്)", "പത്രക്കടലാസ് & പുസ്തകങ്ങൾ", 14.00, "newspaper", "Malayalam/English daily newspapers, notebooks, magazines.", "പത്രങ്ങൾ, പഴയ പുസ്തകങ്ങൾ, മാസികകൾ.", 3.0, 9),
            ("hard_plastic", "Rigid Plastic Buckets & Chairs", "ഹാർഡ് പ്ലാസ്റ്റിക് കസേരകൾ/ബക്കറ്റുകൾ", 20.00, "trash-2", "Broken Nilkamal chairs, broken buckets, laundry tubs.", "പൊട്ടിയ പ്ലാസ്റ്റിക് കസേരകൾ, ബക്കറ്റുകൾ.", 2.0, 10),
        ]

        for slug, n_en, n_ml, rate, icon, d_en, d_ml, min_w, ord_val in scrap_categories:
            sc, _ = ScrapCategory.objects.get_or_create(
                slug=slug,
                defaults={
                    'name_en': n_en, 'name_ml': n_ml,
                    'current_rate_per_kg': rate,
                    'icon': icon,
                    'description_en': d_en, 'description_ml': d_ml,
                    'min_weight_kg': min_w,
                    'order': ord_val,
                    'is_active': True
                }
            )
            ScrapRateHistory.objects.get_or_create(
                category=sc,
                rate_per_kg=rate,
                defaults={'changed_by': admin_user}
            )

        # 9. Subscriptions Plans
        plans_data = [
            {
                "name_en": "Essential Doorstep Daily Plan",
                "name_ml": "നിത്യേനയുള്ള അവശ്യ ശേഖരണ പ്ലാൻ",
                "plan_type": "monthly",
                "price_inr": 199.00,
                "original_price_inr": 249.00,
                "pickups_per_week": 6,
                "description_en": "Daily morning wet kitchen waste collection + twice-weekly dry recyclable pickup in Kochi.",
                "description_ml": "പ്രതിദിന അടുക്കള മാലിന്യ ശേഖരണവും ആഴ്ചയിൽ രണ്ട് തവണ ഉണങ്ങിയ മാലിന്യ ശേഖരണവും.",
                "features_en": ["6 mornings/week wet waste pickup", "Complimentary biodegradable bin liners", "Priority app notifications", "Cancel or pause anytime"],
                "features_ml": ["ആഴ്ചയിൽ 6 ദിവസം പിക്കപ്പ്", "സൗജന്യ ബിൻ ലൈനറുകൾ", "എപ്പോൾ വേണമെങ്കിലും താൽക്കാലികമായി നിർത്താം"],
                "is_popular": True
            },
            {
                "name_en": "Green Family Yearly Saver",
                "name_ml": "വാർഷിക ഗ്രീൻ ഫാമിലി സേവർ പ്ലാൻ",
                "plan_type": "yearly",
                "price_inr": 1899.00,
                "original_price_inr": 2388.00,
                "pickups_per_week": 7,
                "description_en": "Complete 365-day doorstep waste collection service with 20% annual discount and free compost kit.",
                "description_ml": "വർഷം മുഴുവൻ വീട്ടുപടിക്കൽ ശേഖരണം; 20% വിലക്കിഴിവും സൗജന്യ കമ്പോസ്റ്റ് കിറ്റും.",
                "features_en": ["Daily 365-day morning pickup", "20% discount on annual billing", "Free Home Composting Starter Kit", "Instant 250 bonus Green Credits"],
                "features_ml": ["365 ദിവസവും രാവിലെ പിക്കപ്പ്", "20% വാർഷിക കിഴിവ്", "സൗജന്യ കമ്പോസ്റ്റ് കിറ്റ്", "250 ഗ്രീൻ ക്രെഡിറ്റുകൾ ബോണസ്"],
                "is_popular": False
            },
            {
                "name_en": "Standard Bi-Weekly Plan",
                "name_ml": "സ്റ്റാൻഡേർഡ് ദ്വൈവാര പ്ലാൻ",
                "plan_type": "monthly",
                "price_inr": 99.00,
                "original_price_inr": 120.00,
                "pickups_per_week": 2,
                "description_en": "Best suited for working couples and small apartments generating low organic refuse.",
                "description_ml": "ചെറിയ കുടുംബങ്ങൾക്കും ഫ്ലാറ്റുകൾക്കും അനുയോജ്യമായ ആഴ്ചയിൽ രണ്ട് ദിവസത്തെ പ്ലാൻ.",
                "features_en": ["2 scheduled collections per week", "Ideal for low-waste households", "Doorstep weighing on request"],
                "features_ml": ["ആഴ്ചയിൽ 2 പിക്കപ്പുകൾ", "ചെറിയ കുടുംബങ്ങൾക്ക് അനുയോജ്യം"],
                "is_popular": False
            }
        ]

        all_cats = list(WasteCategory.objects.all())
        for pdata in plans_data:
            features_en = pdata.pop('features_en')
            features_ml = pdata.pop('features_ml')
            plan, _ = Plan.objects.get_or_create(
                name_en=pdata['name_en'],
                defaults={
                    **pdata,
                    'features_en': features_en,
                    'features_ml': features_ml
                }
            )
            plan.waste_categories.set(all_cats[:4])

        # Active Subscription for Demo User
        sub_plan = Plan.objects.first()
        today = timezone.now().date()
        sub, _ = Subscription.objects.get_or_create(
            subscription_code="SUB-KOCHI-DEMO1",
            defaults={
                'user': customer_user,
                'plan': sub_plan,
                'address': default_address,
                'status': 'active',
                'start_date': today - timedelta(days=10),
                'end_date': today + timedelta(days=20),
                'preferred_time_window': '08:00 AM - 10:30 AM'
            }
        )

        for d in range(1, 8):
            sch_date = today + timedelta(days=d)
            ScheduledPickup.objects.get_or_create(
                subscription=sub,
                scheduled_date=sch_date,
                defaults={'status': 'scheduled'}
            )

        # 10. Staff Members (Managed by Admin)
        staff_data = [
            ("Babu Rajendran", "+919447101010", "driver", "KL-07-CD-4512", "Piaggio Electric Auto Tipper", created_zones[0]),
            ("Ambili Suresh (Haritha Karma Sena)", "+919447202020", "collector", "KMC-HKS-104", "Electric Tricycle Carrier", created_zones[0]),
            ("Shaji K. Mathew", "+919447303030", "scrap_agent", "KL-07-CB-9081", "Mahindra Bolero Maxi Truck (Digital Scales)", created_zones[0]),
            ("Sreekumar V.", "+919447404040", "collector", "KMC-HKS-209", "Electric Tricycle Carrier", created_zones[1]),
        ]

        created_staff = []
        for name, phone, role, vnum, vtype, szone in staff_data:
            staff, _ = StaffMember.objects.get_or_create(
                phone=phone,
                defaults={
                    'name': name,
                    'role': role,
                    'vehicle_number': vnum,
                    'vehicle_type': vtype,
                    'service_zone': szone,
                    'is_active': True
                }
            )
            created_staff.append(staff)

        # 11. Slots for next 7 days in Kochi zones
        time_windows = [
            (time(7, 30), time(10, 0)),
            (time(10, 30), time(13, 0)),
            (time(14, 0), time(16, 30)),
            (time(17, 0), time(19, 30)),
        ]
        for z in created_zones[:2]:
            for day_offset in range(7):
                slot_date = today + timedelta(days=day_offset)
                for st, et in time_windows:
                    Slot.objects.get_or_create(
                        zone=z,
                        date=slot_date,
                        start_time=st,
                        defaults={
                            'end_time': et,
                            'capacity': 12,
                            'booked_count': 3 if day_offset == 0 else 1,
                            'is_active': True
                        }
                    )

        first_slot = Slot.objects.filter(zone=created_zones[0], date=today).first()

        # 12. Demo Bookings (Different statuses)
        demo_booking_1, _ = Booking.objects.get_or_create(
            booking_number="CL-BK-DEMO-01",
            defaults={
                'customer': customer_user,
                'address': default_address,
                'slot': first_slot,
                'pickup_date': today,
                'preferred_time_window': "07:30 AM - 10:00 AM",
                'assigned_staff': created_staff[1],
                'status': 'staff_assigned',
                'estimated_quantity_kg': 6.5,
                'notes': 'Segregated food scraps and cardboard outside the front door.',
                'fee_amount': 0.00,
                'is_paid': True
            }
        )
        BookingItem.objects.get_or_create(booking=demo_booking_1, category=all_cats[0], defaults={'approx_weight_kg': 4.0})
        BookingItem.objects.get_or_create(booking=demo_booking_1, category=all_cats[1], defaults={'approx_weight_kg': 2.5})

        # Past Collected Booking
        demo_booking_collected, _ = Booking.objects.get_or_create(
            booking_number="CL-BK-DEMO-PAST",
            defaults={
                'customer': customer_user,
                'address': default_address,
                'pickup_date': today - timedelta(days=3),
                'preferred_time_window': "10:30 AM - 01:00 PM",
                'assigned_staff': created_staff[1],
                'status': 'collected',
                'estimated_quantity_kg': 8.0,
                'actual_quantity_kg': 7.8,
                'is_well_segregated': True,
                'green_credits_awarded': 35,
                'rating': 5,
                'review': 'Excellent Haritha Karma Sena staff! Arrived right on schedule.',
                'is_paid': True
            }
        )

        # 13. Demo Scrap Request
        scrap_cat_copper = ScrapCategory.objects.get(slug='copper_wire')
        scrap_cat_boxes = ScrapCategory.objects.get(slug='cardboard_kraft')

        demo_scrap, _ = ScrapRequest.objects.get_or_create(
            request_number="CL-SC-DEMO-01",
            defaults={
                'customer': customer_user,
                'address': default_address,
                'pickup_date': today + timedelta(days=1),
                'preferred_time_window': "10:00 AM - 01:00 PM",
                'assigned_agent': created_staff[2],
                'status': 'agent_assigned',
                'estimated_total_payout': 965.00,
                'notes': 'Old wiring bundle from house renovation + 15 delivery boxes.',
            }
        )
        ScrapRequestItem.objects.get_or_create(
            scrap_request=demo_scrap,
            category=scrap_cat_copper,
            defaults={
                'estimated_weight_kg': 2.0,
                'rate_per_kg_locked': scrap_cat_copper.current_rate_per_kg,
                'payout_amount': 840.00
            }
        )
        ScrapRequestItem.objects.get_or_create(
            scrap_request=demo_scrap,
            category=scrap_cat_boxes,
            defaults={
                'estimated_weight_kg': 10.0,
                'rate_per_kg_locked': scrap_cat_boxes.current_rate_per_kg,
                'payout_amount': 125.00
            }
        )

        # Past Completed Scrap with Wallet Credit
        demo_scrap_paid, _ = ScrapRequest.objects.get_or_create(
            request_number="CL-SC-DEMO-PAST",
            defaults={
                'customer': customer_user,
                'address': default_address,
                'pickup_date': today - timedelta(days=5),
                'assigned_agent': created_staff[2],
                'status': 'weighed_and_paid',
                'estimated_total_payout': 150.00,
                'actual_total_payout': 150.00,
                'payout_credited_to_wallet': True,
                'weighed_at': timezone.now() - timedelta(days=5)
            }
        )

        # 14. Demo Complaint / Grievance
        Complaint.objects.get_or_create(
            ticket_number="CL-GRV-DEMO-01",
            defaults={
                'reporter': customer_user,
                'category': 'illegal_dumping',
                'description': 'Repeated night dumping of commercial food garbage along the Seaport-Airport link road curve.',
                'location_address': 'Near Kakkanad Civil Station junction, Kochi',
                'zone': created_zones[0],
                'latitude': 10.0165,
                'longitude': 76.3425,
                'status': 'under_review',
                'admin_response': 'Noted. Municipal surveillance camera team has been instructed to inspect the stretch.'
            }
        )

        # 15. Seed FAQs
        faqs_data = [
            ("How does Clean Loop coordinate with Kochi's Haritha Karma Sena?",
             "കൊച്ചിയിലെ ഹരിത കർമ്മ സേനയുമായി ക്ലീൻ ലൂപ്പ് എങ്ങനെയാണ് പ്രവർത്തിക്കുന്നത്?",
             "Clean Loop works in direct partnership with local municipal bodies and Kudumbashree Haritha Karma Sena collectors, providing transparent digital scheduling, digital scales, and doorstep convenience.",
             "ക്ലീൻ ലൂപ്പ് തദ്ദേശ സ്വയംഭരണ സ്ഥാപനങ്ങളുമായും കുടുംബശ്രീ ഹരിത കർമ്മ സേനയുമായും കൈകോർത്ത് ഡിജിറ്റൽ സംവിധാനത്തിലൂടെ മാലിന്യ ശേഖരണം കാര്യക്ഷമമാക്കുന്നു."),
            ("How do I get paid for selling scrap items?",
             "ആക്രി സാധനങ്ങൾ വിറ്റാൽ പണം എങ്ങനെ ലഭിക്കും?",
             "Our certified scrap agent visits your home with calibrated digital scales. Upon weighing, the amount is instantly credited to your Clean Loop in-app wallet, which you can withdraw to your UPI ID or bank account anytime.",
             "ഞങ്ങളുടെ ഏജന്റ് ഡിജിറ്റൽ ത്രാസ് ഉപയോഗിച്ച് അളന്ന് തിട്ടപ്പെടുത്തുന്നു. തുക ഉടൻ നിങ്ങളുടെ ക്ലീൻ ലൂപ്പ് വാലറ്റിൽ ക്രെഡിറ്റ് ആകും. ഇത് യുപിഐ (UPI) വഴിയോ ബാങ്കിലേക്കോ മാറ്റാം."),
            ("What should I do if a collection is missed?",
             "പിക്കപ്പ് മുടങ്ങിയാൽ എന്ത് ചെയ്യണം?",
             "Simply open the app, go to Grievances, and report 'Missed Waste Collection'. Our municipal fleet supervisor will dispatch a priority backup vehicle within 4 business hours.",
             "ആപ്പിലെ പരാതി പരിഹാര വിഭാഗത്തിൽ 'Missed Waste Collection' വഴി അറിയിക്കുക. 4 മണിക്കൂറിനുള്ളിൽ പരിഹാരം കാണും.")
        ]
        for q_en, q_ml, a_en, a_ml in faqs_data:
            FAQ.objects.get_or_create(
                question_en=q_en,
                defaults={'question_ml': q_ml, 'answer_en': a_en, 'answer_ml': a_ml}
            )

        ImpactMetricConfig.objects.get_or_create(
            name="Kochi Baseline Metrics",
            defaults={'co2_kg_per_kg_recycled': 1.85, 'trees_equivalent_ratio': 0.045}
        )

        self.stdout.write(self.style.SUCCESS(f"Clean Loop Seed Completed Successfully!"))
        self.stdout.write(self.style.SUCCESS(f"Admin Phone: {admin_phone} (Role: admin, OTP: 123456 in dev mode)"))
        self.stdout.write(self.style.SUCCESS(f"Demo Customer Phone: {demo_customer_phone} (Role: customer, OTP: 123456)"))
