export type AuthPayload = {
  id: string;
  email: string;
  profile: "PATIENT" | "DONOR" | "CENTER" | "CENTER_STAFF";
};

export type THonoAppVariables = { jwtPayload: AuthPayload };
