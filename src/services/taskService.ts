import prisma from "../prisma/client";

export interface CreateTaskInput {
  // either provide dayId, or date/timestamp to auto-create the Day
  dayId?: string;
  dayDate?: Date;
  title?: string;
  description?: string;
  timestamp?: Date;
  audioUrl?: string;
  transcription?: string;
}

export const createTask = async (userId: string, input: CreateTaskInput) => {
  // If dayId provided, validate ownership. Otherwise find or create the Day for the given date/timestamp.
  let dayIdToUse: string;

  if (input.dayId) {
    const day = await prisma.day.findUnique({ where: { id: input.dayId } });
    if (!day) throw new Error("Day not found");
    if (day.userId !== userId) throw new Error("Not authorized to add tasks to this day");
    dayIdToUse = day.id;
  } else {
    const { findOrCreateDayForUser } = await import("./dayService");
    // prefer explicit dayDate, then timestamp, else today
    const d = input.dayDate || input.timestamp || new Date();
    const day = await findOrCreateDayForUser(userId, d);
    dayIdToUse = day.id;
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      ...(input.description && { description: input.description }),
      timestamp: input.timestamp || new Date(),
      ...(input.audioUrl && { audioUrl: input.audioUrl }),
      ...(input.transcription && { transcription: input.transcription }),
      dayId: dayIdToUse,
    },
  });

  return task;
};

export interface GetTasksFilters {
  dayId?: string;
  page?: number;
  perPage?: number;
}

export const getTasks = async (userId: string, filters: GetTasksFilters = {}) => {
  // Get all day IDs for this user
  const days = await prisma.day.findMany({ where: { userId }, select: { id: true } });
  const dayIds = days.map((d) => d.id);

  if (filters.dayId && !dayIds.includes(filters.dayId)) {
    throw new Error("Day not found");
  }

  const whereClause: any = {};
  whereClause.dayId = filters.dayId ? filters.dayId : { in: dayIds };

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const perPage = filters.perPage && filters.perPage > 0 ? filters.perPage : 100;

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: { timestamp: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return tasks;
};

export const updateTask = async (
  userId: string,
  taskId: string,
  data: Partial<{
    title?: string;
    description?: string;
    timestamp?: Date;
    category?: string;
    audioUrl?: string | null;
    transcription?: string | null;
    sentiment?: string | null;
  }>
) => {
  // Ensure task exists and belongs to the user (via Day)
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { Day: true } });
  if (!task) {
    throw new Error("Task not found");
  }
  if ((task as any).Day?.userId !== userId) {
    throw new Error("Not authorized to update this task");
  }

  const updateData: any = {};
  if (typeof data.title !== "undefined") updateData.title = data.title;
  if (typeof data.description !== "undefined") updateData.description = data.description;
  if (typeof data.timestamp !== "undefined") updateData.timestamp = data.timestamp;
  if (typeof data.category !== "undefined") updateData.category = data.category;
  if (typeof data.audioUrl !== "undefined") updateData.audioUrl = data.audioUrl;
  if (typeof data.transcription !== "undefined") updateData.transcription = data.transcription;
  if (typeof data.sentiment !== "undefined") updateData.sentiment = data.sentiment;

  const updated = await prisma.task.update({ where: { id: taskId }, data: updateData });
  return updated;
};

export const deleteTask = async (userId: string, taskId: string) => {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { Day: true } });
  if (!task) {
    throw new Error("Task not found");
  }
  if ((task as any).Day?.userId !== userId) {
    throw new Error("Not authorized to delete this task");
  }

  await prisma.task.delete({ where: { id: taskId } });
  return;
};