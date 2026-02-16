interface HazardData {
  category: string;
  description: string;
  riskLevel: string;
  details: string | null;
  lotoRequired: boolean;
  lotoVerified: boolean;
  lotoNumber: string | null;
  mitigations: { description: string; notes: string | null; isCustom: boolean }[];
}

interface PPEItem {
  ppeType: string;
  isChecked: boolean;
  isRequired: boolean;
}

interface JSAData {
  jobType: string;
  location: string;
  businessUnit: string;
  workOrder: string | null;
  crewMembers: string[];
  jobDescription: string;
  additionalNotes: string | null;
  signatureData: string | null;
  hazards: HazardData[];
  ppeChecklist: PPEItem[];
  attachmentCount: number;
}

interface ScoreBreakdown {
  fieldCompleteness: number;
  hazardSpecificity: number;
  mitigationDetail: number;
  evidenceQuality: number;
  complianceScore: number;
  totalScore: number;
  maxScore: number;
  normalizedScore: number;
}

const SCORING_WEIGHTS = {
  fieldCompleteness: 0.3,
  hazardSpecificity: 0.2,
  mitigationDetail: 0.2,
  evidenceQuality: 0.15,
  complianceScore: 0.15,
};

export function calculateStrengthScore(data: JSAData): { score: number; breakdown: ScoreBreakdown } {
  const fieldCompleteness = calcFieldCompleteness(data);
  const hazardSpecificity = calcHazardSpecificity(data.hazards);
  const mitigationDetail = calcMitigationDetail(data.hazards);
  const evidenceQuality = calcEvidenceQuality(data);
  const complianceScore = calcComplianceScore(data);

  const weightedScore =
    fieldCompleteness * SCORING_WEIGHTS.fieldCompleteness +
    hazardSpecificity * SCORING_WEIGHTS.hazardSpecificity +
    mitigationDetail * SCORING_WEIGHTS.mitigationDetail +
    evidenceQuality * SCORING_WEIGHTS.evidenceQuality +
    complianceScore * SCORING_WEIGHTS.complianceScore;

  const normalizedScore = Math.max(1, Math.min(5, Math.round(weightedScore * 5)));

  const breakdown: ScoreBreakdown = {
    fieldCompleteness: Math.round(fieldCompleteness * 100),
    hazardSpecificity: Math.round(hazardSpecificity * 100),
    mitigationDetail: Math.round(mitigationDetail * 100),
    evidenceQuality: Math.round(evidenceQuality * 100),
    complianceScore: Math.round(complianceScore * 100),
    totalScore: normalizedScore,
    maxScore: 5,
    normalizedScore: Math.round(weightedScore * 100),
  };

  return { score: normalizedScore, breakdown };
}

function calcFieldCompleteness(data: JSAData): number {
  let filled = 0;
  let total = 7;

  if (data.jobType) filled++;
  if (data.location) filled++;
  if (data.businessUnit) filled++;
  if (data.crewMembers.length > 0) filled++;
  if (data.jobDescription && data.jobDescription.length > 10) filled++;
  if (data.signatureData) filled++;
  if (data.workOrder) filled++;

  if (data.additionalNotes) { filled++; total++; } else { total++; }

  return filled / total;
}

function calcHazardSpecificity(hazards: HazardData[]): number {
  if (hazards.length === 0) return 0;

  let score = 0;
  for (const h of hazards) {
    let hazardScore = 0;
    if (h.category) hazardScore += 0.3;
    if (h.description && h.description.length > 5) hazardScore += 0.3;
    if (h.details && h.details.length > 10) hazardScore += 0.2;
    if (h.riskLevel) hazardScore += 0.2;
    score += hazardScore;
  }

  const avgScore = score / hazards.length;
  const countBonus = Math.min(hazards.length / 3, 1) * 0.2;
  return Math.min(1, avgScore + countBonus);
}

function calcMitigationDetail(hazards: HazardData[]): number {
  if (hazards.length === 0) return 0;

  let score = 0;
  for (const h of hazards) {
    if (h.mitigations.length === 0) continue;

    let mitScore = 0;
    const hasMitigations = h.mitigations.length > 0 ? 0.4 : 0;
    const hasMultiple = h.mitigations.length >= 2 ? 0.2 : 0;
    const hasNotes = h.mitigations.some((m) => m.notes && m.notes.length > 5) ? 0.2 : 0;
    const hasCustom = h.mitigations.some((m) => m.isCustom) ? 0.2 : 0;

    mitScore = hasMitigations + hasMultiple + hasNotes + hasCustom;
    score += mitScore;
  }

  return score / hazards.length;
}

function calcEvidenceQuality(data: JSAData): number {
  if (data.attachmentCount === 0) return 0;
  if (data.attachmentCount === 1) return 0.4;
  if (data.attachmentCount === 2) return 0.6;
  if (data.attachmentCount <= 4) return 0.8;
  return 1;
}

function calcComplianceScore(data: JSAData): number {
  let score = 0;
  let checks = 0;

  const requiredPPE = data.ppeChecklist.filter((p) => p.isRequired);
  if (requiredPPE.length > 0) {
    checks++;
    const allChecked = requiredPPE.every((p) => p.isChecked);
    if (allChecked) score++;
  }

  const lotoHazards = data.hazards.filter((h) => h.lotoRequired);
  if (lotoHazards.length > 0) {
    checks++;
    const allVerified = lotoHazards.every((h) => h.lotoVerified && h.lotoNumber);
    if (allVerified) score++;
  }

  if (data.signatureData) {
    checks++;
    score++;
  }

  return checks > 0 ? score / checks : 1;
}
