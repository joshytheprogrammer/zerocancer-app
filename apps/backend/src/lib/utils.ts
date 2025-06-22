import { getDB } from "./db";

export async function getUserWithProfiles({ email }: { email: string }) {
  const db = getDB();
  const user = await db.user.findUnique({
    where: { email },
    include: {
      donorProfile: { select: { id: true } },
      patientProfile: { select: { id: true } },
    },
  });
  //   if (!user)
  //     return {
  //       user: null,
  //       profiles: [],
  //     };

  const userProfiles: ("PATIENT" | "DONOR")[] = [];
  if (user?.donorProfile) {
    userProfiles.push("DONOR");
  }
  if (user?.patientProfile) {
    userProfiles.push("PATIENT");
  }
  return { user, profiles: userProfiles };
}
