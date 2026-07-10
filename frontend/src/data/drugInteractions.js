// Small reference dataset for common, well-known interactions and allergy
// cross-reactions. This is a safety AID for the prescribing doctor — not a
// substitute for full clinical judgement or pharmacist review.

// Allergy keyword -> medicine name patterns that cross-react with it.
export const ALLERGY_CLASS_MAP = {
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'flucloxacillin', 'cloxacillin'],
  sulfa: ['sulfa', 'sulfamethoxazole', 'bactrim', 'co-trimoxazole', 'cotrimoxazole'],
  aspirin: ['aspirin', 'asa'],
  nsaid: ['ibuprofen', 'naproxen', 'diclofenac', 'aspirin', 'mefenamic'],
  cephalosporin: ['cephalexin', 'ceftriaxone', 'cefuroxime', 'cefixime'],
};

// [medicine A keywords, medicine B keywords, warning message]
export const INTERACTION_PAIRS = [
  [['warfarin'], ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac'], 'Increased bleeding risk when combined with warfarin.'],
  [['warfarin'], ['amoxicillin', 'ampicillin', 'ciprofloxacin', 'metronidazole'], 'May increase INR / bleeding risk with warfarin.'],
  [['lisinopril', 'enalapril', 'ramipril'], ['spironolactone', 'potassium'], 'Risk of hyperkalaemia (high potassium).'],
  [['simvastatin', 'atorvastatin'], ['clarithromycin', 'erythromycin'], 'Increased risk of statin-related muscle toxicity (myopathy).'],
  [['digoxin'], ['amiodarone'], 'Amiodarone can raise digoxin levels — risk of digoxin toxicity.'],
  [['metformin'], ['contrast'], 'Risk of lactic acidosis with contrast media — hold metformin if imaging planned.'],
  [['methotrexate'], ['ibuprofen', 'naproxen', 'aspirin'], 'NSAIDs can increase methotrexate toxicity.'],
  [['sildenafil'], ['nitrate', 'gtn', 'isosorbide'], 'Dangerous drop in blood pressure when combined with nitrates.'],
];

const norm = s => (s || '').toLowerCase();
const matches = (name, keywords) => {
  const n = norm(name);
  return keywords.some(k => n.includes(k));
};

// Returns [{ type, medicine, message }] for a proposed medicine name against
// the patient's recorded allergy text.
export function checkAllergyConflicts(medicineName, allergyText) {
  if (!medicineName || !allergyText) return [];
  const allergyLower = norm(allergyText);
  const warnings = [];

  // Direct mention (e.g. allergy text literally contains the drug name)
  if (allergyLower.includes(norm(medicineName)) && medicineName.trim()) {
    warnings.push(`Patient has a recorded allergy matching "${medicineName}".`);
  }

  // Class-based cross-reaction (e.g. "penicillin" allergy vs "amoxicillin")
  for (const [allergyClass, drugKeywords] of Object.entries(ALLERGY_CLASS_MAP)) {
    if (allergyLower.includes(allergyClass) && matches(medicineName, drugKeywords)) {
      warnings.push(`Patient is allergic to ${allergyClass} — "${medicineName}" may cross-react.`);
    }
  }

  return [...new Set(warnings)];
}

// Returns warning strings for a proposed medicine against a list of other
// medicine names (either already-active prescriptions or medicines added in
// the same prescription form).
export function checkDrugInteractions(medicineName, otherMedicineNames) {
  if (!medicineName) return [];
  const warnings = [];
  for (const other of otherMedicineNames) {
    if (!other || norm(other) === norm(medicineName)) continue;
    for (const [aKeywords, bKeywords, message] of INTERACTION_PAIRS) {
      const aHitsThis = matches(medicineName, aKeywords) && matches(other, bKeywords);
      const bHitsThis = matches(medicineName, bKeywords) && matches(other, aKeywords);
      if (aHitsThis || bHitsThis) {
        warnings.push(`"${medicineName}" + "${other}": ${message}`);
      }
    }
  }
  return [...new Set(warnings)];
}
