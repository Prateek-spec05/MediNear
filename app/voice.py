from __future__ import annotations

import re

from app.models import FacilityCategory, VoiceInterpretResponse


EMERGENCY_PATTERNS = (
    r"\b(can't breathe|cannot breathe|difficulty breathing|unconscious|not waking|severe bleeding|chest pain|stroke|heart attack|poisoned|emergency)\b",
    r"सांस नहीं|साँस नहीं|बेहोश|बहुत खून|सीने में दर्द|दिल का दौरा|आपातकाल|जहर|ज़हर",
    r"saans nahi|behosh|bahut khoon|seene mein dard|dil ka daura|zeher|emergency",
)

MEDICAL_ADVICE_PATTERNS = (
    r"\b(dosage|dose|how many (pills|tablets)|how much (medicine|should i take)|prescribe|diagnose)\b",
    r"कितनी गोली|कितनी दवा|कितनी खुराक|दवा की खुराक|निदान|प्रिस्क्रिप्शन",
    r"kitni goli|kitni dava|kitni dawa|kitni khurak|kitna lena|dose batao",
)

CATEGORY_PATTERNS: tuple[tuple[FacilityCategory, tuple[str, ...]], ...] = (
    (FacilityCategory.HOSPITAL, ("hospital", "aspataal", "अस्पताल", "हॉस्पिटल")),
    (FacilityCategory.CLINIC, ("clinic", "doctor clinic", "क्लिनिक", "चिकित्सालय")),
    (
        FacilityCategory.DIAGNOSTIC_CENTER,
        ("diagnostic", "diagnostics", "lab", "laboratory", "जांच केंद्र", "लैब", "डायग्नोस्टिक"),
    ),
    (
        FacilityCategory.PHARMACY,
        ("pharmacy", "chemist", "medical store", "medicine shop", "दवा की दुकान", "मेडिकल स्टोर", "जन औषधि"),
    ),
)

FILLER_PATTERNS = (
    r"\b(near|nearby|in|at|around|find|locate|show me|where is|i need|looking for|please)\b",
    r"के पास|पास में|में|ढूंढो|खोजें|मुझे चाहिए|बताइए|कहाँ है|कहां है",
    r"ke paas|paas mein|dhundo|khoje|mujhe chahiye|bataiye|kahan hai",
)


def interpret_voice(text: str, language: str) -> VoiceInterpretResponse:
    normalized = text.casefold().strip()

    if any(re.search(pattern, normalized, flags=re.IGNORECASE) for pattern in EMERGENCY_PATTERNS):
        return VoiceInterpretResponse(
            action="emergency",
            message=(
                "This demo cannot connect emergency services. If someone may be in immediate danger, "
                "end this session and call 112 now."
                if language == "en"
                else "यह डेमो आपातकालीन सेवा से नहीं जोड़ सकता। अगर किसी की जान को तुरंत खतरा है, "
                "तो यह सत्र बंद करके अभी 112 पर कॉल करें।"
            ),
        )

    if any(re.search(pattern, normalized, flags=re.IGNORECASE) for pattern in MEDICAL_ADVICE_PATTERNS):
        return VoiceInterpretResponse(
            action="medical_advice",
            message=(
                "MediNear only locates facilities. For diagnosis or medicine dosage, contact a doctor or pharmacist."
                if language == "en"
                else "MediNear केवल सुविधा ढूँढने में मदद करता है। बीमारी या दवा की खुराक के लिए डॉक्टर या फार्मासिस्ट से बात करें।"
            ),
        )

    category = FacilityCategory.ALL
    for candidate, phrases in CATEGORY_PATTERNS:
        if any(phrase.casefold() in normalized for phrase in phrases):
            category = candidate
            break

    cleaned = normalized
    for _pattern in CATEGORY_PATTERNS:
        for phrase in _pattern[1]:
            cleaned = re.sub(re.escape(phrase.casefold()), " ", cleaned, flags=re.IGNORECASE)
    for pattern in FILLER_PATTERNS:
        cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,.-")

    if category == FacilityCategory.ALL or not cleaned:
        return VoiceInterpretResponse(
            action="unclear",
            message=(
                "Say a facility type and area, for example, ‘hospital in Kanpur’."
                if language == "en"
                else "सुविधा का प्रकार और इलाका बताइए, जैसे ‘कानपुर में अस्पताल’।"
            ),
        )

    return VoiceInterpretResponse(action="facility_search", category=category, location=cleaned)
