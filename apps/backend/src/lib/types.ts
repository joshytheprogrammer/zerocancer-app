export type AuthPayload = {
  id: string;
  email: string;
  profile: "PATIENT" | "DONOR" | "CENTER" | "CENTER_STAFF" | "ADMIN";
};

export type THonoAppVariables = { jwtPayload: AuthPayload };
