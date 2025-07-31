import { 
  users, events, dailyNotes, statusChangeLogs, clients, sessionNotes, 
  scheduleConflicts, locationSettings, revenueTracking, appointmentTemplates,
  type User, type InsertUser, type Event, type InsertEvent, type DailyNote, 
  type InsertDailyNote, type StatusChangeLog, type InsertStatusChangeLog,
  type Client, type InsertClient, type SessionNote, type InsertSessionNote,
  type ScheduleConflict, type LocationSetting, type InsertLocationSetting,
  type RevenueRecord, type AppointmentTemplate, type InsertAppointmentTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, or, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  createGoogleUser(googleId: string, email: string, name: string): Promise<User>;

  // Event management
  getEvents(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  upsertEvent(userId: number, sourceId: string, event: Partial<Event>): Promise<Event>;
  updateEvent(eventId: number, updates: Partial<Event>): Promise<Event | null>;
  updateEventBySourceId(userId: number, sourceId: string, updates: Partial<Event>): Promise<Event | null>;
  deleteEvent(eventId: number): Promise<void>;
  deleteEventBySourceId(userId: number, sourceId: string): Promise<boolean>;

  // Daily notes
  getDailyNote(userId: number, date: string): Promise<DailyNote | undefined>;
  createOrUpdateDailyNote(note: InsertDailyNote): Promise<DailyNote>;

  // Appointment status methods
  updateEventStatus(userId: number, eventId: string, status: string, reason?: string): Promise<Event>;
  getEventBySourceId(userId: number, sourceId: string): Promise<Event | undefined>;
  createStatusChangeLog(log: InsertStatusChangeLog): Promise<StatusChangeLog>;
  getStatusChangeLogs(userId: number, eventId: string): Promise<StatusChangeLog[]>;

  // Client management
  getClients(userId: number): Promise<Client[]>;
  getClient(clientId: number, userId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(clientId: number, userId: number, updates: Partial<Client>): Promise<Client | null>;
  deleteClient(clientId: number): Promise<void>;
  searchClients(userId: number, query: string): Promise<Client[]>;
  getClientsByTag(userId: number, tag: string): Promise<Client[]>;

  // Session notes
  getSessionNotes(clientId: number, userId: number): Promise<SessionNote[]>;
  getSessionNote(userId: number, noteId: number): Promise<SessionNote | undefined>;
  createSessionNote(note: InsertSessionNote): Promise<SessionNote>;
  updateSessionNote(noteId: number, updates: Partial<SessionNote>): Promise<SessionNote | null>;

  // Session materials
  getSessionMaterials(clientId: number, userId: number): Promise<any[]>;
  createSessionMaterial(material: any): Promise<any>;

  // AI case conceptualization
  getAIConceptualization(clientId: number, userId: number): Promise<any | null>;
  saveAIConceptualization(conceptualization: any): Promise<any>;

  // Client notes
  getClientNotes(clientId: number, userId: number): Promise<any[]>;
  createClientNote(note: any): Promise<any>;

  // Conflict detection
  detectScheduleConflicts(userId: number, startTime: Date, endTime: Date, eventId?: number): Promise<ScheduleConflict[]>;
  createScheduleConflict(conflict: Omit<ScheduleConflict, 'id' | 'createdAt'>): Promise<ScheduleConflict>;
  getScheduleConflicts(userId: number, resolved?: boolean): Promise<ScheduleConflict[]>;
  resolveConflict(conflictId: number): Promise<void>;

  // Location management
  getLocationSettings(userId: number): Promise<LocationSetting[]>;
  createLocationSetting(setting: InsertLocationSetting): Promise<LocationSetting>;
  updateLocationSetting(settingId: number, updates: Partial<LocationSetting>): Promise<LocationSetting | null>;

  // Revenue tracking
  getRevenueRecords(userId: number, startDate?: Date, endDate?: Date): Promise<RevenueRecord[]>;
  createRevenueRecord(record: Omit<RevenueRecord, 'id' | 'createdAt'>): Promise<RevenueRecord>;
  updateRevenueRecord(recordId: number, updates: Partial<RevenueRecord>): Promise<RevenueRecord | null>;
  getRevenueAnalytics(userId: number, startDate: Date, endDate: Date): Promise<any>;

  // Appointment templates
  getAppointmentTemplates(userId: number): Promise<AppointmentTemplate[]>;
  createAppointmentTemplate(template: InsertAppointmentTemplate): Promise<AppointmentTemplate>;
  updateAppointmentTemplate(templateId: number, updates: Partial<AppointmentTemplate>): Promise<AppointmentTemplate | null>;
  deleteAppointmentTemplate(templateId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user || undefined;
    } catch (error) {
      console.error(`Error getting user ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // For default user, always check if one exists first
    if (insertUser.username === 'default_user') {
      // First check by username (most reliable)
      const userByUsername = await this.getUserByUsername('default_user');
      if (userByUsername) {
        console.log('✅ Default user found by username with ID:', userByUsername.id);
        return userByUsername;
      }

      // Check if user with ID 1 exists
      const userById = await this.getUser(1);
      if (userById) {
        console.log('✅ Default user found by ID 1');
        return userById;
      }

      // No existing default user found, create one
      try {
        const [user] = await db
          .insert(users)
          .values({
            username: insertUser.username,
            email: insertUser.email,
            name: insertUser.name || insertUser.username,
            password: insertUser.password,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log('✅ Created new default user with ID:', user.id);
        return user;
      } catch (error) {
        console.error('❌ Error creating default user:', error);
        
        // If creation failed, try to find any existing default user
        const fallbackUser = await this.getUserByUsername('default_user');
        if (fallbackUser) {
          console.log('✅ Using fallback default user with ID:', fallbackUser.id);
          return fallbackUser;
        }
        
        throw error;
      }
    }

    // For non-default users, create normally
    const [user] = await db
      .insert(users)
      .values({
        username: insertUser.username,
        email: insertUser.email,
        name: insertUser.name || insertUser.username,
        password: insertUser.password,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
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

  async updateEvent(eventId: number, updates: Partial<Event>): Promise<Event | null> {
    const [updatedEvent] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, eventId))
      .returning();
    return updatedEvent || null;
  }

  async updateEventBySourceId(userId: number, sourceId: string, updates: Partial<Event>): Promise<Event | null> {
    const [updatedEvent] = await db
      .update(events)
      .set(updates)
      .where(and(eq(events.userId, userId), eq(events.sourceId, sourceId)))
      .returning();
    return updatedEvent || null;
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

  // Client management methods
  async getClients(userId: number): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId));
  }

  async getClient(clientId: number, userId: number): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.id, clientId)));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateClient(clientId: number, userId: number, updates: Partial<Client>): Promise<Client | null> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .returning();
    return client || null;
  }

  async deleteClient(clientId: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, clientId));
  }

  async searchClients(userId: number, query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          or(
            sql`${clients.name} ILIKE ${`%${query}%`}`,
            sql`${clients.email} ILIKE ${`%${query}%`}`,
            sql`${clients.phone} ILIKE ${`%${query}%`}`
          )
        )
      );
  }

  async getClientsByTag(userId: number, tag: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          sql`${tag} = ANY(${clients.tags})`
        )
      );
  }

  // Session notes methods
  async getSessionNotes(clientId: number, userId: number): Promise<SessionNote[]> {
    return await db
      .select()
      .from(sessionNotes)
      .where(and(eq(sessionNotes.userId, userId), eq(sessionNotes.clientId, clientId)))
      .orderBy(desc(sessionNotes.createdAt));
  }

  async getSessionNote(userId: number, noteId: number): Promise<SessionNote | undefined> {
    const [note] = await db
      .select()
      .from(sessionNotes)
      .where(and(eq(sessionNotes.userId, userId), eq(sessionNotes.id, noteId)));
    return note || undefined;
  }

  async createSessionNote(note: InsertSessionNote): Promise<SessionNote> {
    const [newNote] = await db
      .insert(sessionNotes)
      .values(note)
      .returning();
    return newNote;
  }

  async updateSessionNote(noteId: number, updates: Partial<SessionNote>): Promise<SessionNote | null> {
    const [note] = await db
      .update(sessionNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sessionNotes.id, noteId))
      .returning();
    return note || null;
  }

  // Conflict detection methods
  async detectScheduleConflicts(userId: number, startTime: Date, endTime: Date, eventId?: number): Promise<ScheduleConflict[]> {
    // Get overlapping events
    let overlappingEventsQuery = db
      .select()
      .from(events)
      .where(
        and(
          eq(events.userId, userId),
          or(
            and(gte(events.startTime, startTime), lte(events.startTime, endTime)),
            and(gte(events.endTime, startTime), lte(events.endTime, endTime)),
            and(lte(events.startTime, startTime), gte(events.endTime, endTime))
          )
        )
      );

    if (eventId) {
      overlappingEventsQuery = overlappingEventsQuery.where(sql`${events.id} != ${eventId}`);
    }

    const overlappingEvents = await overlappingEventsQuery;

    // Create conflict records for overlapping events
    const conflicts: ScheduleConflict[] = [];
    for (const event of overlappingEvents) {
      conflicts.push({
        id: 0, // Will be set by database
        userId,
        primaryEventId: eventId || 0,
        conflictingEventId: event.id,
        conflictType: 'overlap',
        severity: 'high',
        suggestedResolution: `Consider rescheduling one of the appointments`,
        autoResolved: false,
        acknowledged: false,
        resolvedAt: null,
        createdAt: new Date(),
      });
    }

    return conflicts;
  }

  async createScheduleConflict(conflict: Omit<ScheduleConflict, 'id' | 'createdAt'>): Promise<ScheduleConflict> {
    const [newConflict] = await db
      .insert(scheduleConflicts)
      .values({ ...conflict, createdAt: new Date() })
      .returning();
    return newConflict;
  }

  async getScheduleConflicts(userId: number, resolved?: boolean): Promise<ScheduleConflict[]> {
    let query = db.select().from(scheduleConflicts).where(eq(scheduleConflicts.userId, userId));

    if (resolved !== undefined) {
      if (resolved) {
        query = query.where(sql`${scheduleConflicts.resolvedAt} IS NOT NULL`);
      } else {
        query = query.where(sql`${scheduleConflicts.resolvedAt} IS NULL`);
      }
    }

    return await query.orderBy(desc(scheduleConflicts.createdAt));
  }

  async resolveConflict(conflictId: number): Promise<void> {
    await db
      .update(scheduleConflicts)
      .set({ resolvedAt: new Date() })
      .where(eq(scheduleConflicts.id, conflictId));
  }

  // Location management methods
  async getLocationSettings(userId: number): Promise<LocationSetting[]> {
    return await db.select().from(locationSettings).where(eq(locationSettings.userId, userId));
  }

  async createLocationSetting(setting: InsertLocationSetting): Promise<LocationSetting> {
    const [newSetting] = await db
      .insert(locationSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  async updateLocationSetting(settingId: number, updates: Partial<LocationSetting>): Promise<LocationSetting | null> {
    const [setting] = await db
      .update(locationSettings)
      .set(updates)
      .where(eq(locationSettings.id, settingId))
      .returning();
    return setting || null;
  }

  // Revenue tracking methods
  async getRevenueRecords(userId: number, startDate?: Date, endDate?: Date): Promise<RevenueRecord[]> {
    let query = db.select().from(revenueTracking).where(eq(revenueTracking.userId, userId));

    if (startDate) {
      query = query.where(gte(revenueTracking.sessionDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(revenueTracking.sessionDate, endDate));
    }

    return await query.orderBy(desc(revenueTracking.sessionDate));
  }

  async createRevenueRecord(record: Omit<RevenueRecord, 'id' | 'createdAt'>): Promise<RevenueRecord> {
    const [newRecord] = await db
      .insert(revenueTracking)
      .values({ ...record, createdAt: new Date() })
      .returning();
    return newRecord;
  }

  async updateRevenueRecord(recordId: number, updates: Partial<RevenueRecord>): Promise<RevenueRecord | null> {
    const [record] = await db
      .update(revenueTracking)
      .set(updates)
      .where(eq(revenueTracking.id, recordId))
      .returning();
    return record || null;
  }

  async getRevenueAnalytics(userId: number, startDate: Date, endDate: Date): Promise<any> {
    const records = await this.getRevenueRecords(userId, startDate, endDate);

    const totalPlanned = records.reduce((sum, r) => sum + (r.plannedRevenue || 0), 0);
    const totalActual = records.reduce((sum, r) => sum + (r.actualRevenue || 0), 0);
    const totalSessions = records.length;
    const avgSessionValue = totalSessions > 0 ? totalActual / totalSessions : 0;

    return {
      totalPlannedRevenue: totalPlanned,
      totalActualRevenue: totalActual,
      totalSessions,
      averageSessionValue: avgSessionValue,
      revenueGap: totalPlanned - totalActual,
      period: { startDate, endDate }
    };
  }

  // Appointment template methods
  async getAppointmentTemplates(userId: number): Promise<AppointmentTemplate[]> {
    return await db
      .select()
      .from(appointmentTemplates)
      .where(and(eq(appointmentTemplates.userId, userId), eq(appointmentTemplates.isActive, true)))
      .orderBy(desc(appointmentTemplates.usageCount));
  }

  async createAppointmentTemplate(template: InsertAppointmentTemplate): Promise<AppointmentTemplate> {
    const [newTemplate] = await db
      .insert(appointmentTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateAppointmentTemplate(templateId: number, updates: Partial<AppointmentTemplate>): Promise<AppointmentTemplate | null> {
    const [template] = await db
      .update(appointmentTemplates)
      .set(updates)
      .where(eq(appointmentTemplates.id, templateId))
      .returning();
    return template || null;
  }

  async deleteAppointmentTemplate(templateId: number): Promise<void> {
    await db
      .update(appointmentTemplates)
      .set({ isActive: false })
      .where(eq(appointmentTemplates.id, templateId));
  }

  // Session materials methods
  async getSessionMaterials(clientId: number, userId: number): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT * FROM session_materials 
      WHERE client_id = ${clientId} AND user_id = ${userId}
      ORDER BY uploaded_at DESC
    `);
    return result.rows as any[];
  }

  async createSessionMaterial(material: any): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO session_materials (
        client_id, user_id, material_type, file_name, file_path, 
        file_size, content_text, tags
      ) VALUES (
        ${material.clientId}, ${material.userId}, ${material.materialType},
        ${material.fileName}, ${material.filePath}, ${material.fileSize},
        ${material.contentText || null}, ${material.tags || null}
      ) RETURNING *
    `);
    return result.rows[0];
  }

  // AI case conceptualization methods
  async getAIConceptualization(clientId: number, userId: number): Promise<any | null> {
    const result = await db.execute(sql`
      SELECT * FROM ai_conceptualizations 
      WHERE client_id = ${clientId} AND user_id = ${userId}
      ORDER BY last_updated DESC LIMIT 1
    `);
    return result.rows[0] || null;
  }

  async saveAIConceptualization(conceptualization: any): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO ai_conceptualizations (
        client_id, user_id, conceptualization_text, key_themes,
        recommendations, risk_factors, strengths, treatment_goals, confidence_score
      ) VALUES (
        ${conceptualization.clientId}, ${conceptualization.userId},
        ${conceptualization.conceptualizationText},
        ${conceptualization.keyThemes}, ${conceptualization.recommendations},
        ${conceptualization.riskFactors}, ${conceptualization.strengths},
        ${conceptualization.treatmentGoals}, ${conceptualization.confidenceScore || 0}
      ) RETURNING *
    `);
    return result.rows[0];
  }

  // Client notes methods
  async getClientNotes(clientId: number, userId: number): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT * FROM client_notes 
      WHERE client_id = ${clientId} AND user_id = ${userId}
      ORDER BY created_at DESC
    `);
    return result.rows as any[];
  }

  async createClientNote(note: any): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO client_notes (
        client_id, user_id, note_type, title, content, is_confidential, tags
      ) VALUES (
        ${note.clientId}, ${note.userId}, ${note.noteType || 'general'},
        ${note.title || null}, ${note.content}, ${note.isConfidential || false},
        ${note.tags || null}
      ) RETURNING *
    `);
    return result.rows[0];
  }

  async deleteEventBySourceId(userId: number, sourceId: string): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(and(eq(events.userId, userId), eq(events.sourceId, sourceId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();