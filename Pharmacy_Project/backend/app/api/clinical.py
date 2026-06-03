from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/clinical", tags=["Clinical Assistant"])

class InteractionRequest(BaseModel):
    drug1: str
    drug2: str

class InteractionResponse(BaseModel):
    drug1: str
    drug2: str
    risk_level: str  # CRITICAL, MODERATE, NONE
    mechanism: str
    recommendation: str

class OtcRecommendation(BaseModel):
    symptom: str
    recommended_actives: List[str]
    brand_alternatives_in_stock: List[str]
    dosing_instructions: str
    red_flags: str  # When to consult a physician

# Standard drug interactions database mapping
INTERACTIONS_DB = [
    {
        "drugs": {"aspirin", "warfarin"},
        "risk_level": "CRITICAL",
        "mechanism": "Increased bleeding risk due to synergistic antiplatelet and anticoagulant effects.",
        "recommendation": "STRICT AVOIDANCE or extreme caution. Monitor INR closely. Advise patient to report any signs of bleeding (bruising, dark stools)."
    },
    {
        "drugs": {"sildenafil", "nitroglycerin"},
        "risk_level": "CRITICAL",
        "mechanism": "Severe, life-threatening hypotension due to synergistic vasodilation (cGMP accumulation).",
        "recommendation": "STRICT CONTRAINDICATION. Do not co-prescribe or co-administer under any circumstances."
    },
    {
        "drugs": {"concor", "voltaren"},
        "risk_level": "MODERATE",
        "mechanism": "NSAIDs decrease the antihypertensive efficacy of beta-blockers by inhibiting renal prostaglandin synthesis.",
        "recommendation": "Monitor blood pressure. Consider switching NSAID to paracetamol for mild to moderate pain relief."
    },
    {
        "drugs": {"concor", "ibuprofen"},
        "risk_level": "MODERATE",
        "mechanism": "NSAIDs decrease the antihypertensive efficacy of beta-blockers by inhibiting renal prostaglandin synthesis.",
        "recommendation": "Monitor blood pressure. Consider switching NSAID to paracetamol for mild to moderate pain relief."
    },
    {
        "drugs": {"lipitor", "gomega"},
        "risk_level": "MODERATE",
        "mechanism": "Increased risk of skeletal muscle toxicity (myopathy or rhabdomyolysis) when combined.",
        "recommendation": "Monitor patient for unexplained muscle pain, tenderness, or weakness. Assess creatine kinase (CK) levels if symptomatic."
    },
    {
        "drugs": {"augmentin", "yasmin"},
        "risk_level": "MODERATE",
        "mechanism": "Broad-spectrum antibiotics may decrease enterohepatic recirculation of estrogen, potentially reducing contraceptive efficacy.",
        "recommendation": "Advise the patient to use an additional barrier method of contraception (e.g., condoms) during and for 7 days after the antibiotic course."
    }
]

# Symptom-based OTC recommendation database mapping
OTC_DB = {
    "acid reflux": OtcRecommendation(
        symptom="Acid Reflux / Heartburn (الحموضة)",
        recommended_actives=["Gaviscon Suspension", "Antacod", "Controloc 20mg (Pantoprazole)"],
        brand_alternatives_in_stock=["Gaviscon Advance", "Epicogel Suspension", "Controloc 20mg"],
        dosing_instructions="Take 10ml liquid or 1 tablet 30 minutes after meals and before bedtime.",
        red_flags="Difficulty swallowing (dysphagia), persistent vomiting, blood in vomit or stools, unexplained weight loss."
    ),
    "heartburn": OtcRecommendation(
        symptom="Acid Reflux / Heartburn (الحموضة)",
        recommended_actives=["Gaviscon Suspension", "Antacod", "Controloc 20mg (Pantoprazole)"],
        brand_alternatives_in_stock=["Gaviscon Advance", "Epicogel Suspension", "Controloc 20mg"],
        dosing_instructions="Take 10ml liquid or 1 tablet 30 minutes after meals and before bedtime.",
        red_flags="Difficulty swallowing (dysphagia), persistent vomiting, blood in vomit or stools, unexplained weight loss."
    ),
    "joint pain": OtcRecommendation(
        symptom="Joint Pain / Muscle Ache (آلام المفاصل)",
        recommended_actives=["Panadol Joint", "Voltaren Emulgel", "Brufen 400mg"],
        brand_alternatives_in_stock=["Panadol Joint (665mg)", "Voltaren Gel", "Brufen 400mg"],
        dosing_instructions="Apply gel 3-4 times daily with gentle rub. Oral tablets: 1 tablet after food every 8 hours as needed.",
        red_flags="Severe joint swelling, fever, localized heat, redness, or inability to bear weight on the joint."
    ),
    "muscle pain": OtcRecommendation(
        symptom="Joint Pain / Muscle Ache (آلام المفاصل)",
        recommended_actives=["Panadol Joint", "Voltaren Emulgel", "Brufen 400mg"],
        brand_alternatives_in_stock=["Panadol Joint (665mg)", "Voltaren Gel", "Brufen 400mg"],
        dosing_instructions="Apply gel 3-4 times daily with gentle rub. Oral tablets: 1 tablet after food every 8 hours as needed.",
        red_flags="Severe joint swelling, fever, localized heat, redness, or inability to bear weight on the joint."
    ),
    "dry cough": OtcRecommendation(
        symptom="Dry Cough (السعال الجاف)",
        recommended_actives=["Codilar Syrup", "Sinecod Syrup (Butamirate)"],
        brand_alternatives_in_stock=["Codilar Syrup", "Sinecod Syrup"],
        dosing_instructions="Take 5-10ml three times daily after food.",
        red_flags="Shortness of breath, chest tightness, blood in phlegm, or cough lasting longer than 3 weeks."
    ),
    "wet cough": OtcRecommendation(
        symptom="Wet / Productive Cough (السعال الرطب)",
        recommended_actives=["Mucosolvan Syrup (Ambroxol)", "Farcolin Syrup"],
        brand_alternatives_in_stock=["Mucosolvan", "Farcolin", "Ambroxol Syrup"],
        dosing_instructions="Take 5ml three times daily after food.",
        red_flags="High fever, thick green or rusty-colored sputum, severe difficulty breathing, or persistent chest pain."
    ),
    "headache": OtcRecommendation(
        symptom="Headache / General Pain (الصداع)",
        recommended_actives=["Panadol Extra", "Adolor 20mg (Ketorolac)", "Brufen 400mg"],
        brand_alternatives_in_stock=["Panadol Extra (Red)", "Adolor 20mg", "Brufen 400mg"],
        dosing_instructions="Take 1-2 tablets every 6 hours as needed. Maximum 8 tablets of Paracetamol per day.",
        red_flags="Sudden, explosive headache ('thunderclap'), neck stiffness, high fever, confusion, or visual disturbances."
    )
}

@router.get("/interactions", response_model=InteractionResponse)
async def check_drug_interactions(drug1: str = Query(..., min_length=2), drug2: str = Query(..., min_length=2)):
    d1 = drug1.lower().strip()
    d2 = drug2.lower().strip()
    
    # Check if there is an exact match in our clinical interactions DB
    for interaction in INTERACTIONS_DB:
        if d1 in interaction["drugs"] and d2 in interaction["drugs"]:
            return InteractionResponse(
                drug1=drug1,
                drug2=drug2,
                risk_level=interaction["risk_level"],
                mechanism=interaction["mechanism"],
                recommendation=interaction["recommendation"]
            )
            
    # Default response for no known interaction in this lightweight DB
    return InteractionResponse(
        drug1=drug1,
        drug2=drug2,
        risk_level="NONE",
        mechanism="No documented critical interaction was found in the local ProCare medical gateway.",
        recommendation="No immediate action required. Administer as prescribed while monitoring standard patient response."
    )

@router.get("/otc-recommendations", response_model=OtcRecommendation)
async def get_otc_recommendation(symptom: str = Query(..., min_length=2)):
    sym = symptom.lower().strip()
    
    # Look for exact or partial symptom matching
    for key, rec in OTC_DB.items():
        if key in sym:
            return rec
            
    # Default response for unknown symptoms
    return OtcRecommendation(
        symptom=symptom,
        recommended_actives=["Paracetamol (Standard Pain/Fever Relief)"],
        brand_alternatives_in_stock=["Panadol Blue 500mg"],
        dosing_instructions="Take 1-2 tablets every 6 hours after food as needed.",
        red_flags="Any severe, worsening, or persistent symptoms lasting more than 3-5 days require a medical physician's consultation."
    )
