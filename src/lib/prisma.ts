import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  try {
    return new PrismaClient();
  } catch (error) {
    console.error("❌ Prisma client initialization failed:", error);
    throw error;
  }
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

export default prisma;
