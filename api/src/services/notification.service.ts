import nodemailer from 'nodemailer';
import prisma from '../config/database';
import { config } from '../config';
import { NotificationType, NotificationChannel, UserRole } from '@prisma/client';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
});

export class NotificationService {
  async sendNotification(params: {
    recipientId: string;
    type: NotificationType;
    title: string;
    body: string;
    deepLink?: string;
    channel: NotificationChannel;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    const notification = await prisma.notification.create({ data: params });

    if (params.channel === 'EMAIL') {
      try {
        const recipient = await prisma.user.findUnique({ where: { id: params.recipientId } });
        if (recipient) {
          await transporter.sendMail({
            from: config.smtp.from,
            to: recipient.email,
            subject: params.title,
            html: `
              <h2>${params.title}</h2>
              <p>${params.body}</p>
              ${params.deepLink ? `<p><a href="${config.frontendUrl}${params.deepLink}">View Details</a></p>` : ''}
            `,
          });
          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        }
      } catch (err) {
        console.error('Email send failed:', err);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'FAILED' },
        });
      }
    } else if (params.channel === 'SMS') {
      console.log(`[SMS STUB] To: ${params.recipientId} | ${params.title}: ${params.body}`);
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }

    return notification;
  }

  async notifySupervisorsAndHSE(params: {
    type: NotificationType;
    title: string;
    body: string;
    deepLink?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    const supervisors = await prisma.user.findMany({
      where: { role: { in: ['SUPERVISOR', 'HSE'] }, isActive: true },
    });

    const notifications = await Promise.all(
      supervisors.map((s) =>
        this.sendNotification({
          recipientId: s.id,
          type: params.type,
          title: params.title,
          body: params.body,
          deepLink: params.deepLink,
          channel: 'EMAIL',
          relatedEntityType: params.relatedEntityType,
          relatedEntityId: params.relatedEntityId,
        })
      )
    );

    return notifications;
  }
}

export const notificationService = new NotificationService();
