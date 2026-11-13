import { prisma } from './db';

/** Template ids this signed-in person has saved. Empty for guests — saving needs an account. */
export async function getWishlistIds(userId?: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await prisma.wishlist.findMany({
    where: { userId },
    select: { templateId: true },
  });
  return new Set(rows.map((r) => r.templateId));
}
