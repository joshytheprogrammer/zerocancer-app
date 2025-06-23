export type AuthPayload = {
  id: string;
  email: string;
  profile: "PATIENT" | "DONOR" | "CENTER";
};

export type THonoAppVariables = { jwtPayload: AuthPayload };
