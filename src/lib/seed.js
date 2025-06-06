import prisma from './prisma';

async function seedContributionTypes() {
  // await prisma.contributionType.createMany({
  //   data: [
  //     { name: "Monthly", amount: 300.00 ,is_for_all: true,
  //       start_date: new Date(),
  //        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) 
  //     },
  //     { name: "Registration", amount: 10000.00 ,start_date: new Date(),end_date:
  //       new Date(new Date().setMonth(new Date().getMonth() + 3)) 
  //     },
  //     { name: "Emergency fund", amount: 200.00,start_date: new Date(),end_date:
  //       new Date(new Date().setMonth(new Date().getMonth() + 1)) 
  //     },
  //   ],
  //   skipDuplicates: true, // Avoid errors if types already exist
  // });
  await prisma.contributionSchedule.deleteMany()
  await prisma.balance.deleteMany()
  await prisma.payment()
  // await prisma.contributionType.updateMany({
  //   where: { name: "Registration" },
  //   data: {    
  //     is_for_all: true,
  //   },
  // });
  // await prisma.member.deleteMany()
  // await prisma.contributionType.deleteMany()
  console.log("Contribution types seeded successfully.");}
seedContributionTypes()
  .catch((e) => console.error("Seeding failed:", e))
  .finally(() => prisma.$disconnect());