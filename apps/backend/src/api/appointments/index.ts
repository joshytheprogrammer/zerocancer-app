import { Hono } from "hono";
import { centerAppointmentApp } from "./center.appointment";
import { patientAppointmentApp } from "./patient.appointment";

export const appointmentApp = new Hono();

// ROUTES
appointmentApp.route("/patient", patientAppointmentApp);
appointmentApp.route("/center", centerAppointmentApp);
