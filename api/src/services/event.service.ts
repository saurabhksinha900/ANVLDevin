import prisma from '../config/database';
import { EventType, EventStatus, FlagType, Severity, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { generateReferenceNumber } from '../utils/referenceNumber';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';

export class EventService {
  async createFlag(data: {
    jsaId: string;
    flagType: FlagType;
    reason: string;
    severity?: Severity;
    userId: string;
    ipAddress?: string;
  }) {
    const jsa = await prisma.jSA.findUnique({ where: { id: data.jsaId } });
    if (!jsa) throw new NotFoundError('JSA', data.jsaId);
    if (!['DRAFT', 'SUBMITTED'].includes(jsa.status)) {
      throw new ValidationError('Can only flag draft or submitted JSAs');
    }

    const event = await prisma.event.create({
      data: {
        jsaId: data.jsaId,
        eventType: 'FLAG',
        flagType: data.flagType,
        reason: data.reason,
        severity: data.severity,
        createdById: data.userId,
      },
      include: {
        jsa: { select: { referenceNumber: true, jobType: true, location: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await auditService.log({
      entityType: 'EVENT',
      entityId: event.id,
      action: 'FLAG',
      actorId: data.userId,
      afterSnapshot: event as unknown as object,
      ipAddress: data.ipAddress,
    });

    await notificationService.notifySupervisorsAndHSE({
      type: 'FLAG_RAISED',
      title: `Flag Raised on ${jsa.referenceNumber}`,
      body: `${event.createdBy.firstName} ${event.createdBy.lastName} raised a ${data.flagType} flag: ${data.reason}`,
      deepLink: `/jsas/${data.jsaId}`,
      relatedEntityType: 'EVENT',
      relatedEntityId: event.id,
    });

    return event;
  }

  async createStopJob(data: {
    jsaId: string;
    reason: string;
    severity: Severity;
    userId: string;
    ipAddress?: string;
  }) {
    const jsa = await prisma.jSA.findUnique({
      where: { id: data.jsaId },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!jsa) throw new NotFoundError('JSA', data.jsaId);
    if (jsa.status === 'CLOSED') throw new ValidationError('Cannot stop a closed JSA');

    const event = await prisma.event.create({
      data: {
        jsaId: data.jsaId,
        eventType: 'STOP_JOB',
        reason: data.reason,
        severity: data.severity,
        createdById: data.userId,
      },
    });

    await prisma.jSA.update({
      where: { id: data.jsaId },
      data: { status: 'STOPPED' },
    });

    const supervisors = await prisma.user.findMany({
      where: { role: { in: ['SUPERVISOR', 'HSE'] }, isActive: true },
    });

    let assignee = supervisors[0];
    if (!assignee) {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } });
      if (!admin) throw new ValidationError('No supervisor or admin available for JSO assignment');
      assignee = admin;
    }

    const jso = await prisma.jSO.create({
      data: {
        referenceNumber: generateReferenceNumber('JSO'),
        jsaId: data.jsaId,
        eventId: event.id,
        assignedToId: assignee.id,
      },
    });

    await auditService.log({
      entityType: 'EVENT',
      entityId: event.id,
      action: 'STOP_JOB',
      actorId: data.userId,
      afterSnapshot: { event, jso } as unknown as object,
      ipAddress: data.ipAddress,
    });

    await notificationService.notifySupervisorsAndHSE({
      type: 'STOP_JOB',
      title: `STOP JOB: ${jsa.referenceNumber}`,
      body: `${jsa.createdBy.firstName} ${jsa.createdBy.lastName} stopped job ${jsa.referenceNumber}. Reason: ${data.reason}. A JSO has been auto-created and assigned.`,
      deepLink: `/jsos/${jso.id}`,
      relatedEntityType: 'EVENT',
      relatedEntityId: event.id,
    });

    return { event, jso };
  }

  async resolveEvent(id: string, data: { resolutionNotes: string; userId: string; ipAddress?: string }) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event', id);
    if (event.status !== 'OPEN') throw new ValidationError('Event is not open');

    const updated = await prisma.event.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedById: data.userId,
        resolvedAt: new Date(),
        resolutionNotes: data.resolutionNotes,
      },
      include: {
        jsa: { select: { referenceNumber: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await auditService.log({
      entityType: 'EVENT',
      entityId: id,
      action: 'UPDATE',
      actorId: data.userId,
      afterSnapshot: updated as unknown as object,
      ipAddress: data.ipAddress,
    });

    return updated;
  }

  async listByJSA(jsaId: string) {
    return prisma.event.findMany({
      where: { jsaId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true } },
        jsos: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(params: {
    page: number;
    limit: number;
    eventType?: EventType;
    status?: EventStatus;
  }) {
    const where: Prisma.EventWhereInput = {};
    if (params.eventType) where.eventType = params.eventType;
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          jsa: { select: { id: true, referenceNumber: true, jobType: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.event.count({ where }),
    ]);

    return { data, total, page: params.page, limit: params.limit };
  }
}

export const eventService = new EventService();
