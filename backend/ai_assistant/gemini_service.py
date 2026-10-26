import os
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class GeminiService:
    @staticmethod
    def get_client():
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
        if not api_key or api_key == 'dummy_gemini_api_key_replace_with_real_key':
            return None
        from google import genai
        return genai.Client(api_key=api_key)

    @staticmethod
    def is_available():
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
        return bool(api_key and api_key != 'dummy_gemini_api_key_replace_with_real_key' and getattr(settings, 'AI_ENABLED', True))

    @staticmethod
    def chat_assistant(prompt: str, language: str = 'en') -> dict:
        """
        Waste Assistant Chatbot grounded in Kochi / Kerala waste guidelines.
        """
        if not GeminiService.is_available():
            # Graceful Kerala-informed fallback
            if language == 'ml':
                fallback_msg = (
                    "നമസ്കാരം! ക്ലീൻ ലൂപ്പ് അസിസ്റ്റന്റിലേക്ക് സ്വാഗതം. (AI കീ നൽകിയിട്ടില്ലാത്തതിനാൽ ഓഫ്‌ലൈൻ മോഡ്).\n\n"
                    "• നനഞ്ഞ മാലിന്യങ്ങൾ (ഭക്ഷണം/ജൈവം): പച്ച ബിന്നിൽ സൂക്ഷിക്കുക.\n"
                    "• ഉണങ്ങിയ പ്ലാസ്റ്റിക്, പേപ്പർ, കുപ്പികൾ: കഴുകി ഉണക്കി നീല ബിന്നിൽ സൂക്ഷിക്കുക.\n"
                    "• ആക്രി സാധനങ്ങൾ വിൽക്കാൻ 'Sell Scrap' ഉപയോഗിക്കുക. വീട്ടുപടിക്കൽ പിക്കപ്പ് ലഭ്യമാണ്!"
                )
            else:
                fallback_msg = (
                    "Hello! Welcome to Clean Loop Kochi Waste Assistant (Running in Offline Mode - Gemini Key not set).\n\n"
                    "• Wet Waste (Food & Organic): Keep in Green Bin for composting or Haritha Karma Sena pickup.\n"
                    "• Dry Recyclables (Plastic, Paper, Glass): Clean, dry, and segregate into Blue Bin.\n"
                    "• Scrap metals & e-waste: Schedule a doorstep scrap pickup through the 'Sell Scrap' section for instant payout!"
                )
            return {"response": fallback_msg, "source": "offline_knowledge_base"}

        try:
            from google.genai import types
            from waste_info.models import WasteCategory, RuleAndFine, Tip

            # Build grounded context
            categories = WasteCategory.objects.all()[:8]
            rules = RuleAndFine.objects.filter(is_active=True)[:6]
            tips = Tip.objects.filter(is_active=True)[:4]

            context_str = "Clean Loop Kochi System Knowledge:\n"
            context_str += "Categories:\n" + "\n".join([f"- {c.name_en} / {c.name_ml}: {c.bin_color_en}, {c.description_en}" for c in categories])
            context_str += "\nRules & Fines:\n" + "\n".join([f"- {r.category}: {r.rule_en} (Penalty: {r.penalty_en})" for r in rules])

            system_instruction = (
                "You are Clean Loop Assistant, a polite, helpful smart waste management expert for Kochi city and Kerala, India. "
                "Tagline: 'Segregate. Collect. Recycle. Repeat.' "
                f"User preferred language: {'Malayalam (മലയാളം)' if language == 'ml' else 'English'}. "
                "Respond accurately in the user's preferred language. Ground your answers strictly in Kerala waste segregation practices "
                "(Green bin for organic/wet, Blue for dry/plastic, Red for hazardous, Haritha Karma Sena collection routines). "
                "Politely refuse off-topic questions. If unsure about an exact penalty or rule, clearly state that the resident should verify with Kochi Municipal Corporation."
            )

            client = GeminiService.get_client()
            model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=f"Context:\n{context_str}\n\nUser Question: {prompt}")]
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    max_output_tokens=600,
                )
            )

            return {"response": response.text, "source": "gemini_2.5"}
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            return {
                "response": "Clean Loop AI is momentarily busy. Please refer to our Waste Guide and Rules & Fines table for exact disposal guidelines.",
                "error": str(e)
            }

    @staticmethod
    def identify_waste_photo(image_bytes: bytes, mime_type: str = "image/jpeg", language: str = 'en') -> dict:
        """
        Multimodal photo waste identification returning structured JSON.
        """
        if not GeminiService.is_available():
            return {
                "item_name": "Mixed Plastic Bottle / Packaging",
                "waste_category": "Plastic (Dry Recyclable)",
                "bin_color": "Blue Bin",
                "is_recyclable": True,
                "is_scrap_eligible": True,
                "disposal_steps": [
                    "Rinse thoroughly and let it dry",
                    "Crush to minimize bin volume",
                    "Place in Blue Bin or book doorstep scrap collection"
                ],
                "confidence_score": 0.94,
                "note": "Demo AI identification mode. Connect your Gemini API Key in .env for live multimodal classification."
            }

        try:
            from google.genai import types

            client = GeminiService.get_client()
            model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')

            prompt_text = (
                "Analyze this waste/scrap photo. Identify the primary item and return a STRICT JSON object with these exact keys:\n"
                "- item_name (string, e.g. 'PET Plastic Bottle' or 'Cardboard Box')\n"
                "- waste_category (string, e.g. 'Plastic', 'Organic/Food', 'E-Waste', 'Glass', 'Paper', 'Hazardous')\n"
                "- bin_color (string, e.g. 'Blue Bin (Dry Recyclables)', 'Green Bin (Wet/Biodegradable)', 'Red/Yellow Bin')\n"
                "- is_recyclable (boolean)\n"
                "- is_scrap_eligible (boolean - can a resident sell this for cash to a scrap collector?)\n"
                "- disposal_steps (array of 3 short practical steps)\n"
                "- confidence_score (float between 0.0 and 1.0)\n"
                "- note (short helpful advice tailored to Kochi / Kerala waste rules)\n"
                "Return ONLY raw JSON, no markdown codeblocks."
            )

            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt_text
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )

            data = json.loads(response.text)
            return data
        except Exception as e:
            logger.error(f"Gemini vision error: {e}")
            return {
                "item_name": "Unidentified Item",
                "waste_category": "Dry Waste",
                "bin_color": "Blue Bin",
                "is_recyclable": True,
                "is_scrap_eligible": False,
                "disposal_steps": ["Ensure item is clean and dry", "Segregate into dry bin"],
                "confidence_score": 0.50,
                "error": str(e)
            }

    @staticmethod
    def estimate_scrap_price(description: str, image_bytes: bytes = None, mime_type: str = "image/jpeg") -> dict:
        """
        AI estimates item weights and multiplies by current scrap rate card.
        """
        from scrap.models import ScrapCategory
        rates = list(ScrapCategory.objects.filter(is_active=True).values('slug', 'name_en', 'name_ml', 'current_rate_per_kg'))

        # Fallback estimation heuristic
        est_items = []
        total_min = 0.0
        total_max = 0.0

        desc_lower = description.lower()
        for cat in rates:
            name_low = cat['name_en'].lower()
            if any(k in desc_lower for k in [name_low, cat['slug'], 'metal', 'copper', 'paper', 'plastic', 'box', 'newspaper', 'iron', 'wire']):
                rate = float(cat['current_rate_per_kg'])
                min_w = 3.0
                max_w = 8.0
                p_min = round(min_w * rate, 2)
                p_max = round(max_w * rate, 2)
                est_items.append({
                    "category": cat['name_en'],
                    "category_ml": cat['name_ml'],
                    "rate_per_kg": rate,
                    "estimated_weight_range_kg": f"{min_w} - {max_w} kg",
                    "estimated_payout_range_inr": f"₹{p_min} - ₹{p_max}"
                })
                total_min += p_min
                total_max += p_max

        if not est_items and rates:
            default_cat = rates[0]
            rate = float(default_cat['current_rate_per_kg'])
            est_items.append({
                "category": default_cat['name_en'],
                "category_ml": default_cat['name_ml'],
                "rate_per_kg": rate,
                "estimated_weight_range_kg": "2 - 5 kg",
                "estimated_payout_range_inr": f"₹{2*rate:.0f} - ₹{5*rate:.0f}"
            })
            total_min += 2 * rate
            total_max += 5 * rate

        return {
            "items": est_items,
            "total_estimated_payout_inr": f"₹{total_min:.0f} - ₹{total_max:.0f}",
            "disclaimer": "Estimate only. Final price calculated upon doorstep weighing with calibrated digital scales."
        }

    @staticmethod
    def answer_rules_qa(question: str, language: str = 'en') -> dict:
        """
        Rules & Fines Q&A answered strictly from RuleAndFine table.
        """
        from waste_info.models import RuleAndFine
        rules = RuleAndFine.objects.filter(is_active=True)

        rules_context = []
        for r in rules:
            rules_context.append({
                "id": r.id,
                "category": r.category,
                "rule_en": r.rule_en,
                "rule_ml": r.rule_ml,
                "penalty_en": r.penalty_en,
                "penalty_ml": r.penalty_ml,
                "source": r.source_en
            })

        # Find matching rules
        matches = []
        q_lower = question.lower()
        for r in rules_context:
            if any(term in q_lower for term in ['burn', 'leaf', 'plastic', 'dump', 'fine', 'penalty', 'shop', 'litter', 'commercial', 'hospital', 'biomedical']):
                matches.append(r)

        if not matches:
            matches = rules_context[:3]

        answer_text = (
            f"According to Kerala waste management regulations: {matches[0]['rule_en']} "
            f"The prescribed penalty is: {matches[0]['penalty_en']}."
        ) if language == 'en' else (
            f"കേരളത്തിലെ മാലിന്യ സംസ്കരണ നിയമപ്രകാരം: {matches[0]['rule_ml']} "
            f"ശിക്ഷ/പിഴ: {matches[0]['penalty_ml']}."
        )

        return {
            "answer": answer_text,
            "relevant_rules": matches[:2],
            "disclaimer": "Indicative information. Verify current rules and fines with Kochi Municipal Corporation / Kerala Local Self Government Department."
        }
