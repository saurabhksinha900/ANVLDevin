import prisma from '../config/database';
import { JSOStatus, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';

const jsoInclude = {
  jsa: { select: { id: true, referenceNumber: true, jobType: true, location: true, status: true } },
  event: { select: { id: true, eventType: true, reason: true, severity: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
  completedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};

export class JSOService {
  async list(params: {
    page: number;
    limit: number;
    status?: JSOStatus;
    assignedTo?: string;
    jsaId?: string;
  }) {
    const where: Prisma.JSOWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.assignedTo) where.assignedToId = params.assignedTo;
    if (params.jsaId) where.jsaId = params.jsaId;

    const [data, total] = await Promise.all([
      prisma.jSO.findMany({
        where,
        include: jsoInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.jSO.count({ where }),
    ]);

    return { data, total, page: params.page, limit: params.limit };
  }

  async getById(id: string) {
    const jso = await prisma.jSO.findUnique({ where: { id }, include: jsoInclude });
    if (!jso) throw new NotFoundError('JSO', id);
    return jso;
  }

  async startWork(id: string, userId: string, ipAddress?: string) {
    const jso = await this.getById(id);
    if (jso.assignedToId !== userId) throw new ForbiddenError('Only assignee can start work');
    if (jso.status !== 'PENDING') throw new ValidationError('JSO is not pending');

    const updated = await prisma.jSO.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: jsoInclude,
    });

    await auditService.log({
      entityType: 'JSO',
      entityId: id,
      action: 'UPDATE',
      actorId: userId,
      afterSnapshot: updated as unknown as object,
      ipAddress,
    });

    return updated;
  }

  async complete(id: string, data: {
    rootCause: string;
    correctiveActions: string;
    preventiveActions?: string;
    resolutionNotes?: string;
    observerSignature?: string;
    userId: string;
    ipAddress?: string;
  }) {
    const jso = await this.getById(id);
    if (jso.assignedToId !== data.userId) throw new ForbiddenError('Only assignee can complete');
    if (!['PENDING', 'IN_PROGRESS'].includes(jso.status)) throw new ValidationError('JSO cannot be completed');

    const updated = await prisma.jSO.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        rootCause: data.rootCause,
        correctiveActions: data.correctiveActions,
        preventiveActions: data.preventiveActions,
        resolutionNotes: data.resolutionNotes,
        observerSignature: data.observerSignature,
        completedById: data.userId,
        completedAt: new Date(),
      },
      include: jsoInclude,
    });

    await prisma.event.update({
      where: { id: jso.eventId },
      data: { status: 'RESOLVED', resolvedById: data.userId, resolvedAt: new Date() },
    });

    await auditService.log({
      entityType: 'JSO',
      entityId: id,
      action: 'CLOSE',
      actorId: data.userId,
      afterSnapshot: updated as unknown as object,
      ipAddress: data.ipAddress,
    });

    const jsaCreator = await prisma.jSA.findUnique({
      where: { id: jso.jsaId },
      select: { createdById: true, referenceNumber: true },
    });

    if (jsaCreator) {
      await notificationService.sendNotification({
        recipientId: jsaCreator.createdById,
        type: 'JSO_COMPLETED',
        title: `JSO Completed: ${updated.referenceNumber}`,
        body: `The JSO for JSA ${jsaCreator.referenceNumber} has been completed. The JSA can now be closed.`,
        deepLink: `/jsas/${jso.jsaId}`,
        channel: 'EMAIL',
        relatedEntityType: 'JSO',
        relatedEntityId: id,
      });
    }

    return updated;
  }
}

export const jsoService = new JSOService();
