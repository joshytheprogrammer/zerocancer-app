import { faker } from "@faker-js/faker";
import { getDB } from "./db";

const prisma = getDB();
const TEST_PASSWORDS = ["password123", "testpass456", "demo789"];

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
      {
        id: "treatement",
        name: "treatment",
        description: "treatment-related screenings",
      },
      {
        id: "screening",
        name: "Screening",
        description: "Screening-related stuff",
      },
    ],
    skipDuplicates: true,
  });

  // --- Seed Screening Types ---
  await prisma.screeningType.createMany({
    data: [
      // Cancer
      {
        name: "Cervical Cancer Screening",
        description: "Pap smear test",
        screeningTypeCategoryId: "cancer",
      },
      {
        name: "Breast Cancer Screening",
        description: "Mammography test",
        screeningTypeCategoryId: "cancer",
      },
      {
        name: "Prostate Cancer Screening",
        description: "PSA blood test",
        screeningTypeCategoryId: "cancer",
      },
  
      // Vaccine
      {
        name: "Polio Vaccine",
        description: "Polio immunization",
        screeningTypeCategoryId: "vaccine",
      },
      {
        name: "Hepatitis B Vaccine",
        description: "Prevent Hepatitis B",
        screeningTypeCategoryId: "vaccine",
      },
      {
        name: "HPV Vaccine",
        description: "Protect against HPV infection",
        screeningTypeCategoryId: "vaccine",
      },
  
      // General
      {
        name: "Blood Pressure Check",
        description: "Basic BP screening",
        screeningTypeCategoryId: "general",
      },
      {
        name: "Diabetes Screening",
        description: "Blood sugar test",
        screeningTypeCategoryId: "general",
      },
      {
        name: "Vision Test",
        description: "Basic eye check",
        screeningTypeCategoryId: "general",
      },
  
      // Treatment
      {
        name: "Antiretroviral Therapy",
        description: "HIV treatment access",
        screeningTypeCategoryId: "treatement",
      },
      {
        name: "Malaria Treatment",
        description: "Treatment for malaria-positive patients",
        screeningTypeCategoryId: "treatement",
      },
      {
        name: "Tuberculosis Treatment",
        description: "Free TB treatment",
        screeningTypeCategoryId: "treatement",
      },
  
      // Screening (General-purpose category)
      {
        name: "Body Mass Index (BMI) Screening",
        description: "General obesity and weight check",
        screeningTypeCategoryId: "screening",
      },
      {
        name: "Hearing Test",
        description: "Basic audiometry screening",
        screeningTypeCategoryId: "screening",
      },
      {
        name: "Mental Health Evaluation",
        description: "Depression and anxiety screening",
        screeningTypeCategoryId: "screening",
      },
    ],
    skipDuplicates: true,
  });
  

  const screeningTypes = await prisma.screeningType.findMany();

  // --- Seed Admin ---
  await prisma.admins.upsert({
    where: { email: "ttaiwo4910@gmail.com" },
    update: {},
    create: {
      id: faker.string.uuid(),
      email: "ttaiwo4910@gmail.com",
      passwordHash: faker.internet.password(),
    },
  });

  // --- General Campaign Pool ---
  await prisma.donationCampaign.upsert({
    where: { id: "general-donor-pool" },
    update: {},
    create: {
      id: "general-donor-pool",
      donorId: "general-public",
      availableAmount: 10000,
      reservedAmount: 0,
      initialAmount: 10000,
      status: "ACTIVE",
    },
  });

  // --- Seed Test Donors ---
  const testDonors = await Promise.all(
    TEST_PASSWORDS.map((password, index) =>
      prisma.user.upsert({
        where: { email: `testdonor${index + 1}@example.com` },
        update: {},
        create: {
          fullName: `Test Donor ${index + 1}`,
          email: `testdonor${index + 1}@example.com`,
          phone: faker.phone.number({ style: "human"}),
          passwordHash: password,
          donorProfile: {
            create: {
              organizationName: `Donor Org ${index + 1}`,
              country: "Nigeria",
              emailVerified: new Date(),
            },
          },
        },
      })
    )
  );

  // --- Seed Test Patients ---
  const testPatients = await Promise.all(
    TEST_PASSWORDS.map((password, index) =>
      prisma.user.upsert({
        where: { email: `testpatient${index + 1}@example.com` },
        update: {},
        create: {
          fullName: `Test Patient ${index + 1}`,
          email: `testpatient${index + 1}@example.com`,
          phone: faker.phone.number({ style: "international" }),
          passwordHash: password,
          patientProfile: {
            create: {
              gender: faker.helpers.arrayElement(["male", "female"]),
              dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: "age" }),
              city: index === 0 ? "Lagos" : index === 1 ? "Kano" : "Enugu",
              state: index === 0 ? "Lagos" : index === 1 ? "Kano" : "Enugu",
              emailVerified: new Date(),
            },
          },
        },
      })
    )
  );

  // --- Seed 7 Service Centers ---
  const centerLocations = [
    { state: "Lagos", lga: "Ikeja" },
    { state: "Lagos", lga: "Surulere" },
    { state: "Ogun", lga: "Abeokuta" },
    { state: "Abuja", lga: "Gwarinpa" },
    { state: "Kano", lga: "Nassarawa" },
    { state: "Enugu", lga: "Nsukka" },
    { state: "Sokoto", lga: "Wamakko" },
  ];

  await Promise.allSettled(
    centerLocations.map(async (loc, i) => {
      const center = await prisma.serviceCenter.upsert({
        where: { email: `center${i + 1}@zerocancer.org` },
        update: {},
        create: {
          email: `center${i + 1}@zerocancer.org`,
          passwordHash: "centerpass",
          centerName: `Health Center ${i + 1}`,
          address: faker.location.streetAddress(),
          state: loc.state,
          lga: loc.lga,
          bankName: faker.company.name(),
          bankAccount: faker.finance.accountNumber(),
          status: "ACTIVE",
        },
      });

      // Add 2 staff
      await Promise.all([
        prisma.centerStaff.upsert({
          where: { centerId_email: { centerId: center.id, email: `staff${i + 1}a@zerocancer.africa` } },
          update: {},
          create: {
        email: `staff${i + 1}a@zerocancer.africa`,
        passwordHash: "staffpass",
        role: "admin",
        centerId: center.id,
          },
        }),
        prisma.centerStaff.upsert({
          where: { centerId_email: { centerId: center.id, email: `staff${i + 1}b@zerocancer.africa` } },
          update: {},
          create: {
        email: `staff${i + 1}b@zerocancer.africa`,
        passwordHash: "staffpass",
        role: "nurse",
        centerId: center.id,
          },
        }),
      ]);

      // Attach 2 screening types
      const types = faker.helpers.arrayElements(screeningTypes, 2);
      await prisma.serviceCenter.update({
        where: { id: center.id },
        data: {
          services: {
            connect: types.map((t) => ({ id: t.id })),
          },
        },
      });
    })
  );

  console.log("✅ Seeding complete!");
  console.log("\n🧪 Test Accounts:");
  console.log("📤 Donors:");
  testDonors.forEach((u, i) =>
    console.log(`  ${u.email} / ${TEST_PASSWORDS[i]}`)
  );
  console.log("📥 Patients:");
  testPatients.forEach((u, i) =>
    console.log(`  ${u.email} / ${TEST_PASSWORDS[i]}`)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
