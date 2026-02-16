export interface HazardCatalogEntry {
  category: string;
  hazards: string[];
  mitigations: string[];
  lotoRequired: boolean;
  requiredPPE: string[];
}

export const HAZARD_CATALOG: HazardCatalogEntry[] = [
  {
    category: 'Moving Vehicles',
    hazards: ['Struck by vehicle', 'Backing hazard', 'Pedestrian interaction', 'Loading/unloading'],
    mitigations: ['Spotter required', 'Barricades in place', 'High-vis vest worn', 'Safe distance maintained', 'Vehicle inspection completed'],
    lotoRequired: false,
    requiredPPE: ['hard_hat', 'hi_vis_vest', 'steel_toe_boots'],
  },
  {
    category: 'Work with Electricity',
    hazards: ['Electrical shock', 'Arc flash', 'Electrocution', 'Burns from electrical source'],
    mitigations: ['LOTO applied and verified', 'Insulated tools used', 'Voltage testing before work', 'Arc-rated PPE worn', 'Qualified worker performing task'],
    lotoRequired: true,
    requiredPPE: ['hard_hat', 'safety_glasses', 'face_shield', 'gloves', 'steel_toe_boots'],
  },
  {
    category: 'Lifting Operations',
    hazards: ['Dropped load', 'Rigging failure', 'Overloading', 'Swing radius hazard'],
    mitigations: ['Rigging inspected', 'Tag lines used', 'Exclusion zone established', 'Certified operator', 'Load chart reviewed'],
    lotoRequired: false,
    requiredPPE: ['hard_hat', 'safety_glasses', 'gloves', 'steel_toe_boots'],
  },
  {
    category: 'Moving Machinery',
    hazards: ['Entanglement', 'Pinch points', 'Rotating parts', 'Flying debris'],
    mitigations: ['Machine guarding in place', 'LOTO applied', 'Safe distance maintained', 'Emergency stop accessible', 'Guard inspection completed'],
    lotoRequired: true,
    requiredPPE: ['hard_hat', 'safety_glasses', 'gloves', 'steel_toe_boots', 'hearing_protection'],
  },
  {
    category: 'Work at Height',
    hazards: ['Falls from elevation', 'Dropped objects', 'Unstable surface', 'Ladder failure'],
    mitigations: ['Fall protection harness worn', 'Guardrails installed', 'Tool lanyards used', 'Barricade below work area', 'Ladder inspected'],
    lotoRequired: false,
    requiredPPE: ['hard_hat', 'safety_glasses', 'fall_protection', 'steel_toe_boots'],
  },
  {
    category: 'Fire/Explosions/Arc Flash',
    hazards: ['Ignition sources', 'Flammable materials', 'Arc flash', 'Explosive atmosphere'],
    mitigations: ['Hot work permit obtained', 'Fire watch posted', 'Fire extinguisher present', 'Gas testing completed', 'Flammable materials removed'],
    lotoRequired: false,
    requiredPPE: ['hard_hat', 'safety_glasses', 'face_shield', 'gloves', 'steel_toe_boots'],
  },
  {
    category: 'Restricted Work Space',
    hazards: ['Confined space entry', 'Limited egress', 'Atmospheric hazard', 'Engulfment'],
    mitigations: ['Confined space permit obtained', 'Atmospheric testing done', 'Rescue plan in place', 'Attendant posted', 'Ventilation verified'],
    lotoRequired: false,
    requiredPPE: ['hard_hat', 'safety_glasses', 'respiratory', 'gloves', 'steel_toe_boots'],
  },
  {
    category: 'Ascending/Descending',
    hazards: ['Ladder fall', 'Stairway hazard', 'Slip/trip on steps', 'Scaffold instability'],
    mitigations: ['3-point contact maintained', 'Ladder inspected', 'Handrails used', 'Non-slip footwear', 'Scaffold inspection completed'],
    lotoRequired: false,
    requiredPPE: ['hard_hat', 'safety_glasses', 'steel_toe_boots'],
  },
  {
    category: 'Below Deck/Ventilation/Temperature',
    hazards: ['Oxygen deficiency', 'Toxic atmosphere', 'Heat stress', 'Hypothermia'],
    mitigations: ['Ventilation verified', 'Gas monitor active', 'Buddy system in place', 'Heat/cold stress plan', 'Regular atmosphere checks'],
    lotoRequired: false,
    requiredPPE: ['hard_hat', 'safety_glasses', 'respiratory', 'gloves', 'steel_toe_boots'],
  },
  {
    category: 'Adverse Weather/Rough Seas',
    hazards: ['Lightning strike', 'High wind hazard', 'Rough seas/wave action', 'Reduced visibility'],
    mitigations: ['Weather check completed', 'Postponement criteria reviewed', 'Equipment secured', 'Emergency shelter identified', 'Communication plan active'],
    lotoRequired: false,
    requiredPPE: ['hard_hat', 'hi_vis_vest', 'steel_toe_boots'],
  },
];

export const PPE_CATALOG = [
  { type: 'hard_hat', label: 'Hard Hat', alwaysRequired: true },
  { type: 'safety_glasses', label: 'Safety Glasses', alwaysRequired: true },
  { type: 'hi_vis_vest', label: 'Hi-Vis Vest', alwaysRequired: true },
  { type: 'steel_toe_boots', label: 'Steel-Toe Boots', alwaysRequired: true },
  { type: 'gloves', label: 'Gloves', alwaysRequired: false },
  { type: 'hearing_protection', label: 'Hearing Protection', alwaysRequired: false },
  { type: 'fall_protection', label: 'Fall Protection Harness', alwaysRequired: false },
  { type: 'respiratory', label: 'Respiratory Protection', alwaysRequired: false },
  { type: 'face_shield', label: 'Face Shield', alwaysRequired: false },
];

export const JOB_TYPES = HAZARD_CATALOG.map((h) => h.category);

export const BUSINESS_UNITS = ['Marine', 'Field Service', 'In Shop', 'Power Gen'];

export function getHazardConfig(category: string): HazardCatalogEntry | undefined {
  return HAZARD_CATALOG.find((h) => h.category === category);
}

export function getRequiredPPE(hazardCategories: string[]): string[] {
  const required = new Set<string>();
  PPE_CATALOG.filter((p) => p.alwaysRequired).forEach((p) => required.add(p.type));

  for (const cat of hazardCategories) {
    const cfg = getHazardConfig(cat);
    if (cfg) {
      cfg.requiredPPE.forEach((p) => required.add(p));
    }
  }
  return Array.from(required);
}

export function isLotoRequired(hazardCategories: string[]): boolean {
  return hazardCategories.some((cat) => {
    const cfg = getHazardConfig(cat);
    return cfg?.lotoRequired ?? false;
  });
}
