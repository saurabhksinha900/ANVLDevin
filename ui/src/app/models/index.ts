export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  businessUnit?: string;
  site?: string;
  isActive: boolean;
  createdAt: string;
}

export type UserRole = 'TECHNICIAN' | 'SUPERVISOR' | 'HSE' | 'ADMIN';

export type JSAStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'STOPPED' | 'CLOSED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EventType = 'FLAG' | 'STOP_JOB';
export type EventStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CLOSED';
export type FlagType = 'ASSISTANCE' | 'CONCERN' | 'INFORMATION';
export type Severity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type JSOStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface JSA {
  id: string;
  referenceNumber: string;
  status: JSAStatus;
  jobType: string;
  location: string;
  businessUnit: string;
  dateOfWork: string;
  workOrder?: string;
  crewMembers: string[];
  jobDescription: string;
  additionalNotes?: string;
  signatureData?: string;
  strengthScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  reviewedBy?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  reviewComments?: string;
  hazards: Hazard[];
  ppeChecklist: PPEChecklistItem[];
  attachments: Attachment[];
  events: Event[];
  jsos: JSO[];
  createdAt: string;
  updatedAt: string;
}

export interface Hazard {
  id: string;
  category: string;
  description: string;
  riskLevel: RiskLevel;
  details?: string;
  lotoRequired: boolean;
  lotoVerified: boolean;
  lotoNumber?: string;
  sortOrder: number;
  mitigations: Mitigation[];
}

export interface Mitigation {
  id: string;
  description: string;
  isCustom: boolean;
  notes?: string;
}

export interface PPEChecklistItem {
  id: string;
  ppeType: string;
  label: string;
  isChecked: boolean;
  isRequired: boolean;
  notes?: string;
}

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  jsaId: string;
  eventType: EventType;
  status: EventStatus;
  flagType?: FlagType;
  reason: string;
  severity?: Severity;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
  createdAt: string;
}

export interface JSO {
  id: string;
  referenceNumber: string;
  jsaId: string;
  eventId: string;
  status: JSOStatus;
  rootCause?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  resolutionNotes?: string;
  assignedTo: Pick<User, 'id' | 'firstName' | 'lastName'>;
  completedBy?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  completedAt?: string;
  jsa?: Pick<JSA, 'id' | 'referenceNumber' | 'jobType' | 'location' | 'status'>;
  event?: Pick<Event, 'id' | 'eventType' | 'reason' | 'severity'>;
  createdAt: string;
}

export interface ScoreBreakdown {
  fieldCompleteness: number;
  hazardSpecificity: number;
  mitigationDetail: number;
  evidenceQuality: number;
  complianceScore: number;
  totalScore: number;
  maxScore: number;
  normalizedScore: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardData {
  summary: {
    totalJSAs: number;
    jsasByStatus: Record<string, number>;
    averageStrengthScore: number | null;
    totalEvents: number;
    openFlags: number;
    openStopJobs: number;
    pendingJSOs: number;
  };
  recentJSAs: Array<{
    id: string;
    referenceNumber: string;
    status: JSAStatus;
    jobType: string;
    location: string;
    strengthScore: number | null;
    createdAt: string;
    createdBy: { firstName: string; lastName: string };
  }>;
}

export interface HazardCatalogEntry {
  category: string;
  hazards: string[];
  mitigations: string[];
  lotoRequired: boolean;
  requiredPPE: string[];
}

export interface PPECatalogEntry {
  type: string;
  label: string;
  alwaysRequired: boolean;
}
