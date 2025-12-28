import prisma from "../prisma/client";

function toDateOnlyUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const findOrCreateDayForUser = async (userId: string, date?: Date) => {
  const dateOnly = toDateOnlyUTC(date || new Date());

  const existing = await prisma.day.findFirst({ where: { userId, date: dateOnly } });
  if (existing) return existing;

  const created = await prisma.day.create({ data: { userId, date: dateOnly } });
  return created;
};

export const getDaysForUser = async (userId: string, page = 1, perPage = 50) => {
  const offset = (page - 1) * perPage;
  const days = await prisma.day.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    skip: offset,
    take: perPage,
  });
  return days;
};

export const getDayById = async (userId: string, dayId: string) => {
  const day = await prisma.day.findUnique({ where: { id: dayId }, include: { tasks: true } });
  if (!day) throw new Error("Day not found");
  if (day.userId !== userId) throw new Error("Not authorized to access this day");
  return day;
};