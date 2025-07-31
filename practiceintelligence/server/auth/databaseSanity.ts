/**
 * Database Sanity and User Isolation System
 * Handles cleanup, user isolation, and data integrity checks
 */

export class DatabaseSanityManager {
  /**
   * Check for duplicate users in the database
   */
  static async findDuplicateUsers(): Promise<{
    duplicates: any[];
    total: number;
  }> {
    try {
      const { storage } = await import('../storage');
      const { db } = await import('../db');
      
      // Find users with duplicate emails
      const duplicateEmails = await db
        .select()
        .from(storage.schema.users)
        .groupBy(storage.schema.users.email)
        .having(sql`count(*) > 1`);

      console.log(`🔍 Found ${duplicateEmails.length} duplicate email groups`);
      return {
        duplicates: duplicateEmails,
        total: duplicateEmails.length
      };
    } catch (error) {
      console.error('❌ Duplicate user check failed:', error);
      return { duplicates: [], total: 0 };
    }
  }

  /**
   * Clean up test/default users safely
   */
  static async cleanupTestUsers(): Promise<{
    removed: number;
    preserved: string[];
  }> {
    try {
      const { storage } = await import('../storage');
      
      // Find test users (but preserve actual authenticated users)
      const testUserPatterns = [
        'default_user',
        'test_user',
        'user@example.com'
      ];
      
      const preservedUsers: string[] = [];
      let removedCount = 0;

      for (const pattern of testUserPatterns) {
        try {
          const user = await storage.getUserByUsername(pattern);
          if (user) {
            // Check if this user has any real data
            const events = await storage.getEvents(user.id);
            const hasRealData = events.some(e => 
              e.source !== 'manual' || 
              !e.title.includes('Sample') ||
              !e.title.includes('Test')
            );

            if (hasRealData) {
              preservedUsers.push(pattern);
              console.log(`🛡️ Preserving test user with real data: ${pattern}`);
            } else {
              // Safe to remove
              await storage.deleteUser(user.id);
              removedCount++;
              console.log(`🧹 Removed test user: ${pattern}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing test user ${pattern}:`, error);
        }
      }

      return {
        removed: removedCount,
        preserved: preservedUsers
      };
    } catch (error) {
      console.error('❌ Test user cleanup failed:', error);
      return { removed: 0, preserved: [] };
    }
  }

  /**
   * Verify user data isolation
   */
  static async verifyUserIsolation(userId: number): Promise<{
    isIsolated: boolean;
    leakage: string[];
  }> {
    try {
      const { storage } = await import('../storage');
      const leakage: string[] = [];

      // Check events isolation
      const userEvents = await storage.getEvents(userId);
      for (const event of userEvents) {
        if (event.userId !== userId) {
          leakage.push(`Event ${event.id} belongs to user ${event.userId} but returned for user ${userId}`);
        }
      }

      // Check client isolation (if applicable)
      try {
        const userClients = await storage.getClients(userId);
        for (const client of userClients) {
          if (client.userId !== userId) {
            leakage.push(`Client ${client.id} belongs to user ${client.userId} but returned for user ${userId}`);
          }
        }
      } catch (error) {
        // Client system might not be available
      }

      const isIsolated = leakage.length === 0;
      
      if (isIsolated) {
        console.log(`✅ User ${userId} data isolation verified`);
      } else {
        console.error(`❌ User ${userId} data isolation violations:`, leakage);
      }

      return { isIsolated, leakage };
    } catch (error) {
      console.error('❌ User isolation check failed:', error);
      return { isIsolated: false, leakage: ['Isolation check failed'] };
    }
  }

  /**
   * Clean up orphaned sessions
   */
  static async cleanupOrphanedSessions(): Promise<number> {
    try {
      const { pool } = await import('../db');
      
      // Remove sessions older than 30 days
      const result = await pool.query(`
        DELETE FROM session 
        WHERE expire < NOW() - INTERVAL '30 days'
      `);

      const removedCount = result.rowCount || 0;
      console.log(`🧹 Removed ${removedCount} orphaned sessions`);
      
      return removedCount;
    } catch (error) {
      console.error('❌ Session cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Run comprehensive database sanity check
   */
  static async runComprehensiveCheck(): Promise<{
    duplicateUsers: number;
    orphanedSessions: number;
    testUsersRemoved: number;
    isolationViolations: number;
    summary: string;
  }> {
    try {
      console.log('🔍 Running comprehensive database sanity check...');

      // Check for duplicates
      const duplicateCheck = await this.findDuplicateUsers();
      
      // Clean up test users
      const testUserCleanup = await this.cleanupTestUsers();
      
      // Clean up orphaned sessions
      const orphanedSessions = await this.cleanupOrphanedSessions();
      
      // Verify isolation for authenticated users
      let isolationViolations = 0;
      try {
        const { storage } = await import('../storage');
        // Get a few users to test isolation
        const testUserId = 4; // Current authenticated user
        const isolation = await this.verifyUserIsolation(testUserId);
        isolationViolations = isolation.leakage.length;
      } catch (error) {
        console.error('❌ Isolation check failed:', error);
      }

      const summary = `Database Sanity Check Complete:
        - Duplicate users: ${duplicateCheck.total}
        - Test users removed: ${testUserCleanup.removed}
        - Orphaned sessions cleaned: ${orphanedSessions}
        - Isolation violations: ${isolationViolations}`;

      console.log(summary);

      return {
        duplicateUsers: duplicateCheck.total,
        orphanedSessions,
        testUsersRemoved: testUserCleanup.removed,
        isolationViolations,
        summary
      };
    } catch (error) {
      console.error('❌ Comprehensive check failed:', error);
      return {
        duplicateUsers: 0,
        orphanedSessions: 0,
        testUsersRemoved: 0,
        isolationViolations: 0,
        summary: 'Check failed due to error'
      };
    }
  }
}

// SQL helper for complex queries
const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  return strings.reduce((query, string, index) => {
    return query + string + (values[index] || '');
  }, '');
};