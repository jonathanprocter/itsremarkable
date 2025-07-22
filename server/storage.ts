import { users, events, dailyNotes, statusChangeLogs, type User, type InsertUser, type Event, type InsertEvent, type DailyNote, type InsertDailyNote, type StatusChangeLog, type InsertStatusChangeLog } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGoogleUser(googleId: string, email: string, name: string): Promise<User>;
  getEvents(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  /**
   * Insert or update an event based on its external source ID. If an event
   * with the provided `sourceId` exists for the given user it will be updated,
   * otherwise a new row is created. The method returns the stored event.
   */
  upsertEvent(userId: number, sourceId: string, event: Partial<Event>): Promise<Event>;
  updateEvent(eventId: number, updates: Partial<Event>): Promise<Event>;
  deleteEvent(eventId: number): Promise<void>;
  getDailyNote(userId: number, date: string): Promise<DailyNote | undefined>;
  createOrUpdateDailyNote(note: InsertDailyNote): Promise<DailyNote>;
  // Appointment status methods using existing events table
  updateEventStatus(userId: number, eventId: string, status: string, reason?: string): Promise<Event>;
  getEventBySourceId(userId: number, sourceId: string): Promise<Event | undefined>;
  createStatusChangeLog(log: InsertStatusChangeLog): Promise<StatusChangeLog>;
  getStatusChangeLogs(userId: number, eventId: string): Promise<StatusChangeLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createGoogleUser(googleId: string, email: string, name: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: email,
        googleId: googleId,
        email: email,
        name: name,
        password: null // No password for Google users
      })
      .returning();
    return user;
  }

  async getEvents(userId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.userId, userId));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    return newEvent;
  }

  async upsertEvent(userId: number, sourceId: string, event: Partial<Event>): Promise<Event> {
    const [existing] = await db
      .select()
      .from(events)
      .where(and(eq(events.userId, userId), eq(events.sourceId, sourceId)));

    if (existing) {
      const [updated] = await db
        .update(events)
        .set(event)
        .where(and(eq(events.userId, userId), eq(events.sourceId, sourceId)))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(events)
      .values({ ...event, userId, sourceId })
      .returning();
    return created;
  }

  async updateEvent(eventId: number, updates: Partial<Event>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, eventId))
      .returning();
    return updatedEvent;
  }

  async updateEventBySourceId(userId: number, sourceId: string, updates: Partial<Event>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set(updates)
      .where(and(eq(events.userId, userId), eq(events.sourceId, sourceId)))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(eventId: number): Promise<void> {
    await db.delete(events).where(eq(events.id, eventId));
  }

  async deleteEventBySourceId(userId: number, sourceId: string): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(and(eq(events.userId, userId), eq(events.sourceId, sourceId)))
      .returning();
    return result.length > 0;
  }

  async getDailyNote(userId: number, date: string): Promise<DailyNote | undefined> {
    const [note] = await db
      .select()
      .from(dailyNotes)
      .where(and(eq(dailyNotes.userId, userId), eq(dailyNotes.date, date)));
    return note || undefined;
  }

  async createOrUpdateDailyNote(note: InsertDailyNote): Promise<DailyNote> {
    const existing = await this.getDailyNote(note.userId!, note.date);

    if (existing) {
      const [updatedNote] = await db
        .update(dailyNotes)
        .set({ content: note.content })
        .where(eq(dailyNotes.id, existing.id))
        .returning();
      return updatedNote;
    } else {
      const [newNote] = await db
        .insert(dailyNotes)
        .values(note)
        .returning();
      return newNote;
    }
  }

  // Appointment status methods using existing events table
  async updateEventStatus(userId: number, eventId: string, status: string, reason?: string): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ 
        status: status,
        cancellationReason: reason,
        statusChangedAt: new Date(),
        statusChangedBy: userId
      })
      .where(and(eq(events.userId, userId), eq(events.sourceId, eventId)))
      .returning();
    return updatedEvent;
  }

  async getEventBySourceId(userId: number, sourceId: string): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.userId, userId), eq(events.sourceId, sourceId)));
    return event || undefined;
  }

  async createStatusChangeLog(log: InsertStatusChangeLog): Promise<StatusChangeLog> {
    const [newLog] = await db
      .insert(statusChangeLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getStatusChangeLogs(userId: number, eventId: string): Promise<StatusChangeLog[]> {
    // First get the event to get the internal ID
    const event = await this.getEventBySourceId(userId, eventId);
    if (!event) {
      return [];
    }

    return await db
      .select()
      .from(statusChangeLogs)
      .where(eq(statusChangeLogs.eventId, event.id))
      .orderBy(desc(statusChangeLogs.changedAt));
  }
}

export const storage = new DatabaseStorage();
