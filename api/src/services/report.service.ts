import prisma from '../config/database';

export class ReportService {
  async getDashboard() {
    const [
      totalJSAs,
      jsasByStatus,
      avgStrengthScore,
      totalEvents,
      openFlags,
      openStopJobs,
      pendingJSOs,
      recentJSAs,
    ] = await Promise.all([
      prisma.jSA.count(),
      prisma.jSA.groupBy({ by: ['status'], _count: true }),
      prisma.jSA.aggregate({ _avg: { strengthScore: true }, where: { strengthScore: { not: null } } }),
      prisma.event.count(),
      prisma.event.count({ where: { eventType: 'FLAG', status: 'OPEN' } }),
      prisma.event.count({ where: { eventType: 'STOP_JOB', status: 'OPEN' } }),
      prisma.jSO.count({ where: { status: { not: 'COMPLETED' } } }),
      prisma.jSA.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          jobType: true,
          location: true,
          strengthScore: true,
          createdAt: true,
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const s of jsasByStatus) {
      statusCounts[s.status] = s._count;
    }

    return {
      summary: {
        totalJSAs,
        jsasByStatus: statusCounts,
        averageStrengthScore: avgStrengthScore._avg.strengthScore
          ? Math.round(avgStrengthScore._avg.strengthScore * 10) / 10
          : null,
        totalEvents,
        openFlags,
        openStopJobs,
        pendingJSOs,
      },
      recentJSAs,
    };
  }

  async getStrengthScoreTrends(period: 'weekly' | 'monthly' = 'monthly', months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const jsas = await prisma.jSA.findMany({
      where: {
        strengthScore: { not: null },
        createdAt: { gte: startDate },
      },
      select: { strengthScore: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets: Record<string, { total: number; count: number }> = {};
    for (const jsa of jsas) {
      let key: string;
      if (period === 'weekly') {
        const d = new Date(jsa.createdAt);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else {
        key = jsa.createdAt.toISOString().slice(0, 7);
      }
      if (!buckets[key]) buckets[key] = { total: 0, count: 0 };
      buckets[key].total += jsa.strengthScore!;
      buckets[key].count++;
    }

    return Object.entries(buckets).map(([period, data]) => ({
      period,
      averageScore: Math.round((data.total / data.count) * 10) / 10,
      count: data.count,
    }));
  }

  async exportJSAs(format: 'json' | 'csv', params?: { status?: string; dateFrom?: string; dateTo?: string }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;
    if (params?.dateFrom || params?.dateTo) {
      where.dateOfWork = {
        ...(params?.dateFrom && { gte: new Date(params.dateFrom) }),
        ...(params?.dateTo && { lte: new Date(params.dateTo) }),
      };
    }

    const jsas = await prisma.jSA.findMany({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        hazards: { include: { mitigations: true } },
        ppeChecklist: true,
        _count: { select: { events: true, attachments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'json') return jsas;

    const headers = [
      'Reference Number', 'Status', 'Job Type', 'Location', 'Business Unit',
      'Date of Work', 'Created By', 'Strength Score', 'Hazard Count',
      'Event Count', 'Created At',
    ];

    const rows = jsas.map((j) => [
      j.referenceNumber,
      j.status,
      j.jobType,
      j.location,
      j.businessUnit,
      j.dateOfWork.toISOString().slice(0, 10),
      `${j.createdBy.firstName} ${j.createdBy.lastName}`,
      j.strengthScore?.toString() || '',
      j.hazards.length.toString(),
      j._count.events.toString(),
      j.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    return csv;
  }
}

export const reportService = new ReportService();
