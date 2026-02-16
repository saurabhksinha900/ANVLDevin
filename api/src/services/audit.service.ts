import prisma from '../config/database';
import { AuditAction } from '@prisma/client';

export class AuditService {
  async log(params: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    actorId: string;
    beforeSnapshot?: object;
    afterSnapshot?: object;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditEntry.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actorId: params.actorId,
        beforeSnapshot: params.beforeSnapshot ? JSON.parse(JSON.stringify(params.beforeSnapshot)) : undefined,
        afterSnapshot: params.afterSnapshot ? JSON.parse(JSON.stringify(params.afterSnapshot)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async getEntries(params: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: AuditAction;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.actorId) where.actorId = params.actorId;
    if (params.action) where.action = params.action;
    if (params.from || params.to) {
      where.createdAt = {
        ...(params.from && { gte: params.from }),
        ...(params.to && { lte: params.to }),
      };
    }

    const [data, total] = await Promise.all([
      prisma.auditEntry.findMany({
        where,
        include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.auditEntry.count({ where }),
    ]);

    return { data, total, page: params.page, limit: params.limit };
  }
}

export const auditService = new AuditService();
