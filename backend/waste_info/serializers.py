from rest_framework import serializers
from .models import WasteCategory, DisposalGuide, Fact, Tip, RuleAndFine, FAQ

class DisposalGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisposalGuide
        fields = '__all__'

class WasteCategorySerializer(serializers.ModelSerializer):
    guide = DisposalGuideSerializer(read_only=True)

    class Meta:
        model = WasteCategory
        fields = [
            'id', 'slug', 'name_en', 'name_ml', 'bin_color_en', 'bin_color_ml',
            'color_hex', 'icon', 'description_en', 'description_ml',
            'is_scrap_eligible', 'order', 'guide'
        ]

class FactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fact
        fields = '__all__'

class TipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tip
        fields = '__all__'

class RuleAndFineSerializer(serializers.ModelSerializer):
    class Meta:
        model = RuleAndFine
        fields = '__all__'

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'
