import { faker } from "@faker-js/faker";
import { getDB } from "./db";

const prisma = getDB();

async function main() {
  console.log("🌱 Seeding Zerocancer database...");

  // --- Seed Screening Type Categories ---
  await prisma.screeningTypeCategory.createMany({
    data: [
      {
        id: "cancer",
        name: "Cancer",
        description: "Cancer-related screenings",
      },
      {
        id: "vaccine",
        name: "Vaccine",
        description: "Preventive vaccinations",
      },
      {
        id: "general",
        name: "General",
        description: "General health screenings",
      },
    ],
    skipDuplicates: true,
  });

  // --- Seed Screening Types ---
  await prisma.screeningType.createMany({
    data: [
      {
        name: "Cervical Cancer Screening",
        description: "Pap smear test",
        screeningTypeCategoryId: "cancer",
      },
      {
        name: "Polio Vaccine",
        description: "Polio immunization",
        screeningTypeCategoryId: "vaccine",
      },
      {
        name: "Blood Pressure Check",
        description: "Basic BP screening",
        screeningTypeCategoryId: "general",
      },
    ],
  });

  // --- Seed General Campaigns ---
  await prisma.donationCampaign.create({
    data: {
      id: "general-donor-pool",
      donorId: "general-public",
      availableAmount: 10000, // Example amount
      reservedAmount: 0,
      initialAmount: 10000,
      // amount: 1000,
      // name: "General Health Awareness",
      // description: "Campaign to raise awareness about general health screenings.",
      // screeningTypeId: "general",
      status: "ACTIVE",
    },
  });

  // --- Seed Admin ---
  await prisma.admins.create({
    data: {
      id: faker.string.uuid(),
      email: "ttaiwo4910@gmail.com",
      passwordHash: "faker.internet.password()",
    },
  });

  // --- Seed a Test Donor User ---
  await prisma.user.create({
    data: {
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number({ style: "international" }),
      passwordHash: faker.internet.password(),
      // profile: "DONOR",
      donorProfile: {
        create: {
          organizationName: "Test Org",
          country: "Nigeria",
        },
      },
    },
  });

  // --- Seed a Test Patient User ---
  await prisma.user.create({
    data: {
      fullName: "Jane Patient",
      email: "patient@example.com",
      phone: "08022334455",
      passwordHash: faker.internet.password(),
      // profile: "PATIENT",
      patientProfile: {
        create: {
          gender: "female",
          dateOfBirth: new Date("1990-01-01"),
          city: "Lagos",
          state: "Lagos",
        },
      },
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
