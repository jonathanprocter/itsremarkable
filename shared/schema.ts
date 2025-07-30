import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Appointment Status enum
export const AppointmentStatus = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  CLINICIAN_CANCELED: 'clinician_canceled',
  COMPLETED: 'completed'
} as const;

export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  email: text("email"),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  source: text("source").default("manual"), // 'manual', 'google', 'simplepractice'
  sourceId: text("source_id"),
  calendarId: text("calendar_id"), // For Google Calendar events
  color: text("color").default("#6495ED"),
  notes: text("notes"),
  actionItems: text("action_items"),
  // Location field for appointment location
  location: text("location"), // 'woodbury', 'rvc', 'telehealth', or NULL
  // Appointment status fields
  status: text("status").default("scheduled"), // 'scheduled', 'confirmed', 'cancelled', 'no_show', 'clinician_canceled', 'completed'
  statusChangedBy: integer("status_changed_by").references(() => users.id),
  statusChangedAt: timestamp("status_changed_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyNotes = pgTable("daily_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const statusChangeLogs = pgTable("status_change_logs", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  oldStatus: text("old_status").notNull(),
  newStatus: text("new_status").notNull(),
  changedBy: integer("changed_by").references(() => users.id),
  reason: text("reason"),
  changedAt: timestamp("changed_at").defaultNow(),
});

// Client Management System
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  emergencyContact: text("emergency_contact"),
  notes: text("notes"),
  tags: text("tags").array(),
  status: text("status").default("active"), // 'active', 'inactive', 'archived'
  preferredLocation: text("preferred_location"),
  sessionRate: integer("session_rate"), // in cents
  insurance: text("insurance"),
  totalSessions: integer("total_sessions").default(0),
  totalRevenue: integer("total_revenue").default(0), // in cents
  lastAppointment: timestamp("last_appointment"),
  nextAppointment: timestamp("next_appointment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessionNotes = pgTable("session_notes", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionType: text("session_type"),
  progress: text("progress"),
  goals: text("goals"),
  homework: text("homework"),
  nextSteps: text("next_steps"),
  riskAssessment: text("risk_assessment"),
  sessionNotes: text("session_notes"),
  confidentialNotes: text("confidential_notes"),
  duration: integer("duration"), // in minutes
  sessionValue: integer("session_value"), // in cents
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Conflicts Management
export const scheduleConflicts = pgTable("schedule_conflicts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  primaryEventId: integer("primary_event_id").references(() => events.id),
  conflictingEventId: integer("conflicting_event_id").references(() => events.id),
  conflictType: text("conflict_type").notNull(), // 'overlap', 'travel_time', 'double_booking', 'break_violation'
  severity: text("severity").default("medium"), // 'low', 'medium', 'high', 'critical'
  suggestedResolution: text("suggested_resolution"),
  autoResolved: boolean("auto_resolved").default(false),
  acknowledged: boolean("acknowledged").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Travel Time and Location Management
export const locationSettings = pgTable("location_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  locationName: text("location_name").notNull(),
  address: text("address"),
  travelTimeMinutes: integer("travel_time_minutes").default(0),
  isDefault: boolean("is_default").default(false),
  coordinates: text("coordinates"), // lat,lng format
  bufferTimeMinutes: integer("buffer_time_minutes").default(15),
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue and Analytics Tracking
export const revenueTracking = pgTable("revenue_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventId: integer("event_id").references(() => events.id),
  clientId: integer("client_id").references(() => clients.id),
  sessionDate: timestamp("session_date").notNull(),
  sessionType: text("session_type"),
  plannedRevenue: integer("planned_revenue"), // in cents
  actualRevenue: integer("actual_revenue"), // in cents
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'overdue', 'cancelled'
  paymentMethod: text("payment_method"), // 'insurance', 'self_pay', 'sliding_scale'
  insuranceClaim: text("insurance_claim"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Template Management for Quick Actions
export const appointmentTemplates = pgTable("appointment_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  title: text("title"),
  description: text("description"),
  duration: integer("duration").default(60), // in minutes
  location: text("location"),
  sessionType: text("session_type"),
  defaultRate: integer("default_rate"), // in cents
  preparationNotes: text("preparation_notes"),
  followUpNotes: text("follow_up_notes"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  totalSessions: true,
  totalRevenue: true,
  lastAppointment: true,
  nextAppointment: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionNoteSchema = createInsertSchema(sessionNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentTemplateSchema = createInsertSchema(appointmentTemplates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
});

export const insertLocationSettingSchema = createInsertSchema(locationSettings).omit({
  id: true,
  createdAt: true,
});

// Type exports for all new schemas
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type SessionNote = typeof sessionNotes.$inferSelect;
export type InsertSessionNote = z.infer<typeof insertSessionNoteSchema>;

export type ScheduleConflict = typeof scheduleConflicts.$inferSelect;

export type LocationSetting = typeof locationSettings.$inferSelect;
export type InsertLocationSetting = z.infer<typeof insertLocationSettingSchema>;

export type RevenueRecord = typeof revenueTracking.$inferSelect;

export type AppointmentTemplate = typeof appointmentTemplates.$inferSelect;
export type InsertAppointmentTemplate = z.infer<typeof insertAppointmentTemplateSchema>;

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyNotesSchema = createInsertSchema(dailyNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStatusChangeLogSchema = createInsertSchema(statusChangeLogs).omit({
  id: true,
  changedAt: true,
});



export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type DailyNote = typeof dailyNotes.$inferSelect;
export type InsertDailyNote = z.infer<typeof insertDailyNotesSchema>;
export type StatusChangeLog = typeof statusChangeLogs.$inferSelect;
export type InsertStatusChangeLog = z.infer<typeof insertStatusChangeLogSchema>;
