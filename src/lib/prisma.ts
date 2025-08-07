// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Use a slightly different naming convention to avoid confusion with the PrismaClient class itself
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Define a type for the Prisma Client singleton
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// Ensure the global type is augmented correctly
declare global {
  var prismaGlobal: PrismaClientSingleton | undefined; // Use 'var' for global declarations
}

// Use a more concise and clear way to access the globalThis
const prisma = globalThis.prismaGlobal || prismaClientSingleton();

// Prevent multiple instances in development (Crucial for Next.js hot reloading)
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

export default prisma;
