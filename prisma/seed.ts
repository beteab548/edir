import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function main() {
  console.log(`Start seeding ...`);

  // --- Family 1: A standard married couple ---
  await prisma.$transaction(async (tx) => {
    const family1 = await tx.family.create({ data: { familyId: "FAM-0001" } });
    console.log(`Created family with ID: ${family1.id}`);

    const principal1 = await tx.member.create({
      data: {
        familyId: family1.id,
        isPrincipal: true,
        first_name: "John",
        last_name: "Doe",
        sex: "Male",
        marital_status: "married",
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1980-05-15"),
        registered_date: new Date("2015-01-20"),
        phone_number: "+15551112222",
        email: "john.doe@example.com",
        custom_id: "EDM-0001",
      },
    });

    const spouse1 = await tx.member.create({
      data: {
        familyId: family1.id,
        isPrincipal: false,
        first_name: "Jane",
        last_name: "Doe",
        sex: "Female",
        marital_status: "married",
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1982-08-22"),
        registered_date: new Date("2015-01-20"),
        phone_number: "+15551113333",
        email: "jane.doe@example.com",
        custom_id: "EDM-0002",
      },
    });

    // Link them as spouses
    await tx.member.update({ where: { id: principal1.id }, data: { spouseId: spouse1.id } });
    await tx.member.update({ where: { id: spouse1.id }, data: { spouseId: principal1.id } });
  });

  // --- Family 2: A single member ---
  await prisma.$transaction(async (tx) => {
    const family2 = await tx.family.create({ data: { familyId: "FAM-0002" } });
    console.log(`Created family with ID: ${family2.id}`);

    await tx.member.create({
      data: {
        familyId: family2.id,
        isPrincipal: true,
        first_name: "Maria",
        last_name: "Garcia",
        sex: "Female",
        marital_status: "single",
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1990-11-30"),
        registered_date: new Date("2018-03-12"),
        phone_number: "+15552224444",
        email: "maria.garcia@example.com",
        custom_id: "EDM-0003",
      },
    });
  });

  // --- Family 3: A widowed member ---
  await prisma.$transaction(async (tx) => {
    const family3 = await tx.family.create({ data: { familyId: "FAM-0003" } });
    console.log(`Created family with ID: ${family3.id}`);

    await tx.member.create({
      data: {
        familyId: family3.id,
        isPrincipal: true,
        first_name: "Kenji",
        last_name: "Tanaka",
        sex: "Male",
        marital_status: "widowed",
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1975-02-10"),
        registered_date: new Date("2014-06-01"),
        phone_number: "+819012345678",
        custom_id: "EDM-0004",
      },
    });
  });
  
  // --- Family 4: A deceased member with a surviving (now widowed) spouse ---
  await prisma.$transaction(async (tx) => {
    const family4 = await tx.family.create({ data: { familyId: "FAM-0004" } });
    console.log(`Created family with ID: ${family4.id}`);

    const principal4 = await tx.member.create({
      data: {
        familyId: family4.id,
        isPrincipal: true,
        first_name: "David",
        last_name: "Wilson",
        sex: "Male",
        marital_status: "married",
        status: "Deceased", // This member is deceased
        status_updated_at: new Date("2023-10-05"),
        member_type: "Existing",
        birth_date: new Date("1968-04-20"),
        registered_date: new Date("2013-02-15"),
        custom_id: "EDM-0005",
      },
    });

    const spouse4 = await tx.member.create({
      data: {
        familyId: family4.id,
        isPrincipal: false, // Will become principal later
        first_name: "Susan",
        last_name: "Wilson",
        sex: "Female",
        marital_status: "widowed", // Status updated
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1970-07-18"),
        registered_date: new Date("2013-02-15"),
        phone_number: "+447700900123",
        custom_id: "EDM-0006",
      },
    });
    // Link them as spouses
    await tx.member.update({ where: { id: principal4.id }, data: { spouseId: spouse4.id } });
    await tx.member.update({ where: { id: spouse4.id }, data: { spouseId: principal4.id } });
  });

  // --- Family 5: A member who has left ---
  await prisma.$transaction(async (tx) => {
    const family5 = await tx.family.create({ data: { familyId: "FAM-0005" } });
    console.log(`Created family with ID: ${family5.id}`);

    await tx.member.create({
      data: {
        familyId: family5.id,
        isPrincipal: true,
        first_name: "Emily",
        last_name: "Carter",
        sex: "Female",
        marital_status: "divorced",
        status: "Left",
        status_updated_at: new Date("2022-01-15"),
        member_type: "Existing",
        birth_date: new Date("1988-09-05"),
        registered_date: new Date("2019-11-20"),
        custom_id: "EDM-0007",
      },
    });
  });

  // --- Family 6: Founding Members ---
  await prisma.$transaction(async (tx) => {
    const family6 = await tx.family.create({ data: { familyId: "FAM-0006" } });
    console.log(`Created family with ID: ${family6.id}`);

    const principal6 = await tx.member.create({
      data: {
        familyId: family6.id,
        isPrincipal: true,
        first_name: "Samuel",
        last_name: "Dubois",
        sex: "Male",
        marital_status: "married",
        status: "Active",
        member_type: "Existing",
        founding_member: true, // Founding member
        birth_date: new Date("1965-01-01"),
        registered_date: new Date("2012-01-01"),
        custom_id: "EDM-0008",
      },
    });

    const spouse6 = await tx.member.create({
      data: {
        familyId: family6.id,
        isPrincipal: false,
        first_name: "Beatrice",
        last_name: "Dubois",
        sex: "Female",
        marital_status: "married",
        status: "Active",
        member_type: "Existing",
        founding_member: true, // Founding member
        birth_date: new Date("1966-03-03"),
        registered_date: new Date("2012-01-01"),
        custom_id: "EDM-0009",
      },
    });
    await tx.member.update({ where: { id: principal6.id }, data: { spouseId: spouse6.id } });
    await tx.member.update({ where: { id: spouse6.id }, data: { spouseId: principal6.id } });
  });

  // --- Family 7: Inactive Member ---
  await prisma.$transaction(async (tx) => {
    const family7 = await tx.family.create({ data: { familyId: "FAM-0007" } });
     console.log(`Created family with ID: ${family7.id}`);
    await tx.member.create({
      data: {
        familyId: family7.id,
        isPrincipal: true,
        first_name: "Chinedu",
        last_name: "Okoro",
        sex: "Male",
        marital_status: "single",
        status: "Inactive",
        status_updated_at: new Date(),
        member_type: "Existing",
        birth_date: new Date("1992-06-25"),
        registered_date: new Date("2020-02-02"),
        custom_id: "EDM-0010",
      },
    });
  });

  // --- Family 8: New Member from this year ---
  await prisma.$transaction(async (tx) => {
    const family8 = await tx.family.create({ data: { familyId: "FAM-0008" } });
    console.log(`Created family with ID: ${family8.id}`);
    await tx.member.create({
      data: {
        familyId: family8.id,
        isPrincipal: true,
        first_name: "Liam",
        last_name: "Smith",
        sex: "Male",
        marital_status: "single",
        status: "Active",
        member_type: "New", // New member
        birth_date: new Date("1995-04-12"),
        registered_date: new Date(), // Registered today
        custom_id: "EDM-0011",
      },
    });
  });

  // --- Family 9: Couple with more filled-out data ---
  await prisma.$transaction(async (tx) => {
    const family9 = await tx.family.create({ data: { familyId: "FAM-0009" } });
    console.log(`Created family with ID: ${family9.id}`);
    const principal9 = await tx.member.create({
      data: {
        familyId: family9.id,
        isPrincipal: true,
        first_name: "Ivan",
        last_name: "Ivanov",
        sex: "Male",
        marital_status: "married",
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1985-10-10"),
        registered_date: new Date("2017-08-14"),
        phone_number: "+79161234567",
        email: "ivan.i@example.com",
        profession: "Engineer",
        bank_name: "Sberbank",
        bank_account_number: "40817810000000001234",
        custom_id: "EDM-0012",
      },
    });
    const spouse9 = await tx.member.create({
      data: {
        familyId: family9.id,
        isPrincipal: false,
        first_name: "Svetlana",
        last_name: "Ivanova",
        sex: "Female",
        marital_status: "married",
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1987-12-01"),
        registered_date: new Date("2017-08-14"),
        custom_id: "EDM-0013",
      },
    });
    await tx.member.update({ where: { id: principal9.id }, data: { spouseId: spouse9.id } });
    await tx.member.update({ where: { id: spouse9.id }, data: { spouseId: principal9.id } });
  });

  // --- Family 10: Another active couple ---
  await prisma.$transaction(async (tx) => {
    const family10 = await tx.family.create({ data: { familyId: "FAM-0010" } });
    console.log(`Created family with ID: ${family10.id}`);
    const principal10 = await tx.member.create({
      data: {
        familyId: family10.id,
        isPrincipal: true,
        first_name: "Aisha",
        last_name: "Khan",
        sex: "Female", // Female Principal
        marital_status: "married",
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1989-07-21"),
        registered_date: new Date("2021-05-19"),
        custom_id: "EDM-0014",
      },
    });
    const spouse10 = await tx.member.create({
      data: {
        familyId: family10.id,
        isPrincipal: false,
        first_name: "Omar",
        last_name: "Khan",
        sex: "Male",
        marital_status: "married",
        status: "Active",
        member_type: "Existing",
        birth_date: new Date("1986-11-11"),
        registered_date: new Date("2021-05-19"),
        custom_id: "EDM-0015",
      },
    });
    await tx.member.update({ where: { id: principal10.id }, data: { spouseId: spouse10.id } });
    await tx.member.update({ where: { id: spouse10.id }, data: { spouseId: principal10.id } });
  });

  console.log(`Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });