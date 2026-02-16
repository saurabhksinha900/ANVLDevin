import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@connected-worker.local' },
    update: {},
    create: {
      email: 'admin@connected-worker.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      businessUnit: 'Corporate',
      site: 'HQ',
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@connected-worker.local' },
    update: {},
    create: {
      email: 'supervisor@connected-worker.local',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Supervisor',
      role: 'SUPERVISOR',
      businessUnit: 'Marine',
      site: 'Site A',
    },
  });

  const hse = await prisma.user.upsert({
    where: { email: 'hse@connected-worker.local' },
    update: {},
    create: {
      email: 'hse@connected-worker.local',
      passwordHash,
      firstName: 'Mark',
      lastName: 'Safety',
      role: 'HSE',
      businessUnit: 'Marine',
      site: 'Site A',
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { email: 'tech1@connected-worker.local' },
    update: {},
    create: {
      email: 'tech1@connected-worker.local',
      passwordHash,
      firstName: 'John',
      lastName: 'Technician',
      role: 'TECHNICIAN',
      businessUnit: 'Marine',
      site: 'Site A',
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: 'tech2@connected-worker.local' },
    update: {},
    create: {
      email: 'tech2@connected-worker.local',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Worker',
      role: 'TECHNICIAN',
      businessUnit: 'Field Service',
      site: 'Site B',
    },
  });

  console.log('Users seeded:', { admin: admin.id, supervisor: supervisor.id, hse: hse.id, tech1: tech1.id, tech2: tech2.id });

  const jsa = await prisma.jSA.create({
    data: {
      referenceNumber: 'JSA-20260215-0001',
      status: 'SUBMITTED',
      jobType: 'Work with Electricity',
      location: 'Building A - Electrical Room',
      businessUnit: 'Marine',
      dateOfWork: new Date('2026-02-15'),
      workOrder: 'WO-2026-0042',
      crewMembers: ['John Technician', 'Sarah Worker'],
      jobDescription: 'Replace faulty breaker panel in electrical room. Requires LOTO procedure.',
      additionalNotes: 'Ensure backup generator is available.',
      strengthScore: 4,
      scoreBreakdown: {
        fieldCompleteness: 88,
        hazardSpecificity: 80,
        mitigationDetail: 75,
        evidenceQuality: 40,
        complianceScore: 100,
        totalScore: 4,
        maxScore: 5,
        normalizedScore: 78,
      },
      submittedAt: new Date(),
      createdById: tech1.id,
      hazards: {
        create: [
          {
            category: 'Work with Electricity',
            description: 'Electrical shock hazard from exposed wiring during breaker replacement',
            riskLevel: 'HIGH',
            details: 'Main panel will be de-energized but adjacent circuits remain live',
            lotoRequired: true,
            lotoVerified: true,
            lotoNumber: 'LOTO-2026-0089',
            sortOrder: 0,
            mitigations: {
              create: [
                { description: 'LOTO applied and verified by two workers' },
                { description: 'Voltage testing before work begins' },
                { description: 'Insulated tools used for all connections' },
                { description: 'Arc-rated PPE worn by all crew', notes: 'Min 8 cal/cm2 rating' },
              ],
            },
          },
          {
            category: 'Fire/Explosions/Arc Flash',
            description: 'Arc flash potential during breaker testing',
            riskLevel: 'MEDIUM',
            details: 'Risk during energization testing after replacement',
            lotoRequired: false,
            sortOrder: 1,
            mitigations: {
              create: [
                { description: 'Fire extinguisher present within 10 feet' },
                { description: 'Arc flash boundary calculated and marked' },
                { description: 'Only qualified workers within boundary during testing' },
              ],
            },
          },
        ],
      },
      ppeChecklist: {
        create: [
          { ppeType: 'hard_hat', label: 'Hard Hat', isChecked: true, isRequired: true },
          { ppeType: 'safety_glasses', label: 'Safety Glasses', isChecked: true, isRequired: true },
          { ppeType: 'hi_vis_vest', label: 'Hi-Vis Vest', isChecked: true, isRequired: true },
          { ppeType: 'steel_toe_boots', label: 'Steel-Toe Boots', isChecked: true, isRequired: true },
          { ppeType: 'gloves', label: 'Insulated Gloves', isChecked: true, isRequired: true },
          { ppeType: 'face_shield', label: 'Face Shield', isChecked: true, isRequired: true },
          { ppeType: 'hearing_protection', label: 'Hearing Protection', isChecked: false, isRequired: false },
        ],
      },
    },
  });

  console.log('Sample JSA seeded:', jsa.id);

  const draftJSA = await prisma.jSA.create({
    data: {
      referenceNumber: 'JSA-20260216-0002',
      status: 'DRAFT',
      jobType: 'Lifting Operations',
      location: 'Dock 3 - Crane Area',
      businessUnit: 'Marine',
      dateOfWork: new Date('2026-02-16'),
      crewMembers: ['Sarah Worker'],
      jobDescription: 'Overhead crane lift of engine component from vessel deck to pier.',
      createdById: tech2.id,
      hazards: {
        create: [
          {
            category: 'Lifting Operations',
            description: 'Dropped load risk during crane operation',
            riskLevel: 'HIGH',
            sortOrder: 0,
            mitigations: {
              create: [
                { description: 'Rigging inspected before lift' },
                { description: 'Tag lines used to control load' },
              ],
            },
          },
        ],
      },
      ppeChecklist: {
        create: [
          { ppeType: 'hard_hat', label: 'Hard Hat', isChecked: true, isRequired: true },
          { ppeType: 'safety_glasses', label: 'Safety Glasses', isChecked: true, isRequired: true },
          { ppeType: 'hi_vis_vest', label: 'Hi-Vis Vest', isChecked: true, isRequired: true },
          { ppeType: 'steel_toe_boots', label: 'Steel-Toe Boots', isChecked: true, isRequired: true },
          { ppeType: 'gloves', label: 'Gloves', isChecked: false, isRequired: true },
        ],
      },
    },
  });

  console.log('Draft JSA seeded:', draftJSA.id);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
