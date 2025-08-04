import { PrismaClient } from "../../../prisma/v1/generated";
import { env } from "@/env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
