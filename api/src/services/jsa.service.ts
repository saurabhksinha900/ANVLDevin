import prisma from '../config/database';
import { JSAStatus, UserRole, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { generateReferenceNumber } from '../utils/referenceNumber';
import { calculateStrengthScore } from '../rules/scoring';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';

const jsaInclude = {
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  hazards: { include: { mitigations: true }, orderBy: { sortOrder: 'asc' as const } },
  ppeChecklist: true,
  attachments: true,
  events: { include: { createdBy: { select: { id: true, firstName: true, lastName: true } } } },
  jsos: { include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } } },
};

export class JSAService {
  async list(params: {
    page: number;
    limit: number;
    status?: JSAStatus;
    jobType?: string;
    businessUnit?: string;
    createdBy?: string;
    strengthScoreMin?: number;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    userId: string;
    userRole: UserRole;
  }) {
    const where: Prisma.JSAWhereInput = {};

    if (params.userRole === 'TECHNICIAN') {
      where.createdById = params.userId;
    }
    if (params.status) where.status = params.status;
    if (params.jobType) where.jobType = params.jobType;
    if (params.businessUnit) where.businessUnit = params.businessUnit;
    if (params.createdBy) where.createdById = params.createdBy;
    if (params.strengthScoreMin) where.strengthScore = { gte: params.strengthScoreMin };
    if (params.dateFrom || params.dateTo) {
      where.dateOfWork = {
        ...(params.dateFrom && { gte: new Date(params.dateFrom) }),
        ...(params.dateTo && { lte: new Date(params.dateTo) }),
      };
    }

    const orderBy: Record<string, string> = {};
    orderBy[params.sort || 'createdAt'] = params.order || 'desc';

    const [data, total] = await Promise.all([
      prisma.jSA.findMany({
        where,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { events: true, attachments: true } },
        },
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.jSA.count({ where }),
    ]);

    return { data, total, page: params.page, limit: params.limit };
  }

  async getById(id: string) {
    const jsa = await prisma.jSA.findUnique({ where: { id }, include: jsaInclude });
    if (!jsa) throw new NotFoundError('JSA', id);
    return jsa;
  }

  async create(data: {
    jobType: string;
    location: string;
    businessUnit: string;
    dateOfWork: string;
    workOrder?: string;
    crewMembers: string[];
    jobDescription: string;
    additionalNotes?: string;
    hazards?: Array<{
      category: string;
      description: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      details?: string;
      lotoRequired?: boolean;
      lotoVerified?: boolean;
      lotoNumber?: string;
      mitigations?: Array<{ description: string; notes?: string; isCustom?: boolean }>;
    }>;
    ppeChecklist?: Array<{
      ppeType: string;
      label: string;
      isChecked: boolean;
      isRequired: boolean;
      notes?: string;
    }>;
    userId: string;
    ipAddress?: string;
  }) {
    const jsa = await prisma.jSA.create({
      data: {
        referenceNumber: generateReferenceNumber('JSA'),
        jobType: data.jobType,
        location: data.location,
        businessUnit: data.businessUnit,
        dateOfWork: new Date(data.dateOfWork),
        workOrder: data.workOrder,
        crewMembers: data.crewMembers,
        jobDescription: data.jobDescription,
        additionalNotes: data.additionalNotes,
        createdById: data.userId,
        hazards: data.hazards ? {
          create: data.hazards.map((h, i) => ({
            category: h.category,
            description: h.description,
            riskLevel: h.riskLevel,
            details: h.details,
            lotoRequired: h.lotoRequired || false,
            lotoVerified: h.lotoVerified || false,
            lotoNumber: h.lotoNumber,
            sortOrder: i,
            mitigations: h.mitigations ? {
              create: h.mitigations.map((m) => ({
                description: m.description,
                notes: m.notes,
                isCustom: m.isCustom || false,
              })),
            } : undefined,
          })),
        } : undefined,
        ppeChecklist: data.ppeChecklist ? {
          create: data.ppeChecklist.map((p) => ({
            ppeType: p.ppeType,
            label: p.label,
            isChecked: p.isChecked,
            isRequired: p.isRequired,
            notes: p.notes,
          })),
        } : undefined,
      },
      include: jsaInclude,
    });

    await auditService.log({
      entityType: 'JSA',
      entityId: jsa.id,
      action: 'CREATE',
      actorId: data.userId,
      afterSnapshot: jsa as unknown as object,
      ipAddress: data.ipAddress,
    });

    return jsa;
  }

  async update(id: string, data: Record<string, unknown>, userId: string, ipAddress?: string) {
    const existing = await this.getById(id);
    if (existing.createdById !== userId) throw new ForbiddenError('Can only edit own JSAs');
    if (existing.status !== 'DRAFT') throw new ValidationError('Can only edit draft JSAs');

    const jsa = await prisma.jSA.update({
      where: { id },
      data: {
        jobType: data.jobType as string | undefined,
        location: data.location as string | undefined,
        businessUnit: data.businessUnit as string | undefined,
        dateOfWork: data.dateOfWork ? new Date(data.dateOfWork as string) : undefined,
        workOrder: data.workOrder as string | undefined,
        crewMembers: data.crewMembers as string[] | undefined,
        jobDescription: data.jobDescription as string | undefined,
        additionalNotes: data.additionalNotes as string | undefined,
      },
      include: jsaInclude,
    });

    await auditService.log({
      entityType: 'JSA',
      entityId: id,
      action: 'UPDATE',
      actorId: userId,
      beforeSnapshot: existing as unknown as object,
      afterSnapshot: jsa as unknown as object,
      ipAddress,
    });

    return jsa;
  }

  async submit(id: string, userId: string, ipAddress?: string) {
    const existing = await this.getById(id);
    if (existing.createdById !== userId) throw new ForbiddenError('Can only submit own JSAs');
    if (existing.status !== 'DRAFT') throw new ValidationError('Can only submit draft JSAs');

    const attachmentCount = await prisma.attachment.count({
      where: { entityType: 'JSA', entityId: id },
    });

    const { score, breakdown } = calculateStrengthScore({
      jobType: existing.jobType,
      location: existing.location,
      businessUnit: existing.businessUnit,
      workOrder: existing.workOrder,
      crewMembers: existing.crewMembers,
      jobDescription: existing.jobDescription,
      additionalNotes: existing.additionalNotes,
      signatureData: existing.signatureData,
      hazards: existing.hazards.map((h) => ({
        category: h.category,
        description: h.description,
        riskLevel: h.riskLevel,
        details: h.details,
        lotoRequired: h.lotoRequired,
        lotoVerified: h.lotoVerified,
        lotoNumber: h.lotoNumber,
        mitigations: h.mitigations.map((m) => ({
          description: m.description,
          notes: m.notes,
          isCustom: m.isCustom,
        })),
      })),
      ppeChecklist: existing.ppeChecklist.map((p) => ({
        ppeType: p.ppeType,
        isChecked: p.isChecked,
        isRequired: p.isRequired,
      })),
      attachmentCount,
    });

    const jsa = await prisma.jSA.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        strengthScore: score,
        scoreBreakdown: breakdown as unknown as Prisma.JsonObject,
      },
      include: jsaInclude,
    });

    await auditService.log({
      entityType: 'JSA',
      entityId: id,
      action: 'SUBMIT',
      actorId: userId,
      afterSnapshot: jsa as unknown as object,
      ipAddress,
    });

    await notificationService.notifySupervisorsAndHSE({
      type: 'JSA_SUBMITTED',
      title: `New JSA Submitted: ${jsa.referenceNumber}`,
      body: `${existing.createdBy.firstName} ${existing.createdBy.lastName} submitted a JSA for ${jsa.jobType} at ${jsa.location}`,
      deepLink: `/jsas/${jsa.id}`,
      relatedEntityType: 'JSA',
      relatedEntityId: jsa.id,
    });

    if (score <= 2) {
      await notificationService.notifySupervisorsAndHSE({
        type: 'LOW_SCORE',
        title: `Low Quality JSA: ${jsa.referenceNumber} (Score: ${score}/5)`,
        body: `JSA ${jsa.referenceNumber} received a low strength score of ${score}/5. Please review.`,
        deepLink: `/jsas/${jsa.id}`,
        relatedEntityType: 'JSA',
        relatedEntityId: jsa.id,
      });
    }

    return jsa;
  }

  async approve(id: string, userId: string, comments?: string, ipAddress?: string) {
    const existing = await this.getById(id);
    if (existing.status !== 'SUBMITTED') throw new ValidationError('Can only approve submitted JSAs');

    const snapshot = JSON.parse(JSON.stringify(existing));
    const jsa = await prisma.jSA.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: userId,
        reviewComments: comments,
        reviewedAt: new Date(),
        approvedSnapshot: snapshot as unknown as Prisma.JsonObject,
      },
      include: jsaInclude,
    });

    await auditService.log({
      entityType: 'JSA',
      entityId: id,
      action: 'APPROVE',
      actorId: userId,
      afterSnapshot: jsa as unknown as object,
      ipAddress,
    });

    await notificationService.sendNotification({
      recipientId: existing.createdById,
      type: 'JSA_APPROVED',
      title: `JSA Approved: ${jsa.referenceNumber}`,
      body: `Your JSA ${jsa.referenceNumber} has been approved.${comments ? ` Comments: ${comments}` : ''}`,
      deepLink: `/jsas/${jsa.id}`,
      channel: 'EMAIL',
      relatedEntityType: 'JSA',
      relatedEntityId: jsa.id,
    });

    return jsa;
  }

  async reject(id: string, userId: string, comments: string, ipAddress?: string) {
    const existing = await this.getById(id);
    if (existing.status !== 'SUBMITTED') throw new ValidationError('Can only reject submitted JSAs');
    if (!comments) throw new ValidationError('Comments are required when rejecting');

    const jsa = await prisma.jSA.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: userId,
        reviewComments: comments,
        reviewedAt: new Date(),
      },
      include: jsaInclude,
    });

    await auditService.log({
      entityType: 'JSA',
      entityId: id,
      action: 'REJECT',
      actorId: userId,
      afterSnapshot: jsa as unknown as object,
      ipAddress,
    });

    await notificationService.sendNotification({
      recipientId: existing.createdById,
      type: 'JSA_REJECTED',
      title: `JSA Rejected: ${jsa.referenceNumber}`,
      body: `Your JSA ${jsa.referenceNumber} has been rejected. Comments: ${comments}`,
      deepLink: `/jsas/${jsa.id}/edit`,
      channel: 'EMAIL',
      relatedEntityType: 'JSA',
      relatedEntityId: jsa.id,
    });

    return jsa;
  }

  async close(id: string, userId: string, ipAddress?: string) {
    const existing = await this.getById(id);
    if (!['APPROVED', 'STOPPED'].includes(existing.status)) {
      throw new ValidationError('Can only close approved or stopped (with completed JSO) JSAs');
    }

    if (existing.status === 'STOPPED') {
      const pendingJSOs = existing.jsos.filter((j) => j.status !== 'COMPLETED');
      if (pendingJSOs.length > 0) {
        throw new ValidationError('All JSOs must be completed before closing a stopped JSA');
      }
    }

    const jsa = await prisma.jSA.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: jsaInclude,
    });

    await auditService.log({
      entityType: 'JSA',
      entityId: id,
      action: 'CLOSE',
      actorId: userId,
      afterSnapshot: jsa as unknown as object,
      ipAddress,
    });

    return jsa;
  }

  async addSignature(id: string, signatureData: string, userId: string) {
    const existing = await this.getById(id);
    if (existing.createdById !== userId) throw new ForbiddenError('Can only sign own JSAs');

    return prisma.jSA.update({
      where: { id },
      data: { signatureData },
      include: jsaInclude,
    });
  }
}

export const jsaService = new JSAService();
