import { prisma } from './db';

export type Settings = Awaited<ReturnType<typeof getSettings>>;

export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: 1 } });
}
