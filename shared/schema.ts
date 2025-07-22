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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

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
