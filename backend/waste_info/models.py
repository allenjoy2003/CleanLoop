from django.db import models

class WasteCategory(models.Model):
    slug = models.SlugField(max_length=50, unique=True)
    name_en = models.CharField(max_length=100)
    name_ml = models.CharField(max_length=100)
    bin_color_en = models.CharField(max_length=50) # e.g. "Green Bin (Biodegradable)"
    bin_color_ml = models.CharField(max_length=50) # e.g. "പച്ച ബിൻ"
    color_hex = models.CharField(max_length=20, default="#1F5D3A")
    icon = models.CharField(max_length=50, default="trash-2") # lucide icon name
    description_en = models.TextField()
    description_ml = models.TextField()
    is_scrap_eligible = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name_en']

    def __str__(self):
        return f"{self.name_en} / {self.name_ml}"

class DisposalGuide(models.Model):
    category = models.OneToOneField(WasteCategory, on_delete=models.CASCADE, related_name='guide')
    what_it_is_en = models.TextField()
    what_it_is_ml = models.TextField()
    dos_en = models.JSONField(default=list) # List of string points
    dos_ml = models.JSONField(default=list)
    donts_en = models.JSONField(default=list)
    donts_ml = models.JSONField(default=list)
    who_collects_en = models.CharField(max_length=255) # e.g. "Haritha Karma Sena / Clean Loop"
    who_collects_ml = models.CharField(max_length=255) # e.g. "ഹരിത കർമ്മ സേന / ക്ലീൻ ലൂപ്പ്"
    how_to_prepare_en = models.TextField()
    how_to_prepare_ml = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Guide: {self.category.name_en}"

class Fact(models.Model):
    CATEGORY_CHOICES = (
        ('kerala', 'Kerala & Kochi Focus'),
        ('india', 'India National'),
        ('recycling', 'Recycling & Economy'),
        ('plastic', 'Plastic Waste'),
        ('organic', 'Organic & Composting'),
    )
    tag = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='kerala')
    fact_en = models.TextField()
    fact_ml = models.TextField()
    source_en = models.CharField(max_length=200, blank=True)
    source_ml = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', '-id']

    def __str__(self):
        return f"Fact [{self.tag}]: {self.fact_en[:40]}..."

class Tip(models.Model):
    CATEGORY_CHOICES = (
        ('segregation', 'Segregation'),
        ('composting', 'Composting'),
        ('reduction', 'Waste Reduction'),
        ('reuse', 'Reuse & Upcycling'),
        ('kitchen', 'Kitchen Waste'),
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='segregation')
    title_en = models.CharField(max_length=200)
    title_ml = models.CharField(max_length=200)
    content_en = models.TextField()
    content_ml = models.TextField()
    icon = models.CharField(max_length=50, default="lightbulb")
    is_today_tip = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-is_today_tip', 'order', '-id']

    def __str__(self):
        return f"Tip: {self.title_en}"

class RuleAndFine(models.Model):
    CATEGORY_CHOICES = (
        ('open_dumping', 'Open Dumping & Littering'),
        ('waste_burning', 'Burning of Waste / Leaves'),
        ('plastic_ban', 'Single-Use Plastic Ban'),
        ('commercial', 'Commercial & Bulk Generators'),
        ('e_waste', 'E-Waste & Hazardous Disposal'),
        ('biomedical', 'Biomedical & Sanitary Waste'),
        ('construction', 'Construction & Demolition Debris'),
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='open_dumping')
    rule_en = models.TextField()
    rule_ml = models.TextField()
    penalty_en = models.CharField(max_length=255) # e.g. "Fine up to ₹5,000 + legal notice"
    penalty_ml = models.CharField(max_length=255) # e.g. "₹5,000 വരെ പിഴയും നിയമ നടപടിയും"
    penalty_amount_min = models.PositiveIntegerField(default=0)
    penalty_amount_max = models.PositiveIntegerField(default=0)
    source_en = models.CharField(max_length=255, default="KMC / Kerala LSGD Waste Bye-laws")
    source_ml = models.CharField(max_length=255, default="കൊച്ചി കോർപ്പറേഷൻ / തദ്ദേശ സ്വയംഭരണ വകുപ്പ്")
    needs_verification = models.BooleanField(default=True, help_text="Indicative sample data - verify with authority")
    last_verified = models.DateField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'penalty_amount_min']

    def __str__(self):
        return f"[{self.category}] {self.penalty_en}"

class FAQ(models.Model):
    question_en = models.CharField(max_length=300)
    question_ml = models.CharField(max_length=300)
    answer_en = models.TextField()
    answer_ml = models.TextField()
    category = models.CharField(max_length=50, default='general')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return self.question_en
