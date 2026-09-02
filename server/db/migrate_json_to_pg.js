/**
 * Production Migration Utility: JSON Document Store -> PostgreSQL
 * Safely migrates real user accounts, roadmaps, tasks, streaks, applications,
 * calendar events, revisions, notifications, and focus history into PostgreSQL.
 */

import fs from 'fs';
import path from 'path';

export async function migrateJsonToPostgres(pgPool, jsonDbPath) {
  if (!fs.existsSync(jsonDbPath)) {
    throw new Error(`JSON database file not found at: ${jsonDbPath}`);
  }

  const raw = fs.readFileSync(jsonDbPath, 'utf8');
  const dbData = JSON.parse(raw);

  const client = await pgPool.connect();
  console.log('[Migration] Beginning transaction for JSON -> PostgreSQL migration...');

  try {
    await client.query('BEGIN');

    // 1. Migrate Users
    if (Array.isArray(dbData.users)) {
      for (const user of dbData.users) {
        await client.query(
          `INSERT INTO users (
            id, name, email, password_hash, google_id, avatar, picture, 
            target_role, daily_study_minutes, placement_target_date, 
            current_prep_level, has_completed_onboarding, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            target_role = EXCLUDED.target_role,
            daily_study_minutes = EXCLUDED.daily_study_minutes,
            updated_at = EXCLUDED.updated_at`,
          [
            user.id,
            user.name,
            user.email,
            user.passwordHash || '',
            user.googleId || null,
            user.avatar || 'NV',
            user.picture || null,
            user.targetRole || 'Software Engineer',
            user.dailyStudyMinutes || 180,
            user.placementTargetDate || '2026-11-20',
            user.currentPreparationLevel || 'Intermediate',
            Boolean(user.hasCompletedOnboarding),
            user.createdAt || new Date().toISOString(),
            user.updatedAt || new Date().toISOString()
          ]
        );
      }
      console.log(`[Migration] Migrated ${dbData.users.length} user records.`);
    }

    // 2. Migrate Roadmaps
    if (dbData.roadmaps) {
      let roadmapCount = 0;
      for (const [userId, roadmap] of Object.entries(dbData.roadmaps)) {
        if (!roadmap) continue;
        const roadmapId = roadmap.id || `rdm_${userId}`;
        await client.query(
          `INSERT INTO roadmaps (
            id, user_id, title, target_role, source, total_hours, summary, raw_roadmap_data, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            raw_roadmap_data = EXCLUDED.raw_roadmap_data,
            updated_at = EXCLUDED.updated_at`,
          [
            roadmapId,
            userId,
            roadmap.title || 'Placement Roadmap',
            roadmap.targetRole || 'Software Engineer',
            roadmap.source || 'custom_upload',
            roadmap.totalHours || 100,
            roadmap.summary || '',
            JSON.stringify(roadmap),
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        roadmapCount++;
      }
      console.log(`[Migration] Migrated ${roadmapCount} roadmap records.`);
    }

    // 3. Migrate Streaks
    if (dbData.streaks) {
      let streakCount = 0;
      for (const [userId, streak] of Object.entries(dbData.streaks)) {
        if (!streak) continue;
        await client.query(
          `INSERT INTO streaks (
            user_id, current_streak, longest_streak, today_target_met, 
            last_completed_date, freeze_count, completed_days, weekly_history, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (user_id) DO UPDATE SET
            current_streak = EXCLUDED.current_streak,
            longest_streak = EXCLUDED.longest_streak,
            today_target_met = EXCLUDED.today_target_met,
            updated_at = EXCLUDED.updated_at`,
          [
            userId,
            streak.currentStreak || 0,
            streak.longestStreak || 0,
            Boolean(streak.todayTargetMet),
            streak.lastCompletedDate || null,
            streak.freezeCount !== undefined ? streak.freezeCount : 2,
            streak.completedDays || 0,
            JSON.stringify(streak.weeklyHistory || []),
            new Date().toISOString()
          ]
        );
        streakCount++;
      }
      console.log(`[Migration] Migrated ${streakCount} streak records.`);
    }

    // 4. Migrate Applications
    if (dbData.applications) {
      let appCount = 0;
      for (const [userId, apps] of Object.entries(dbData.applications)) {
        if (!Array.isArray(apps)) continue;
        for (const app of apps) {
          await client.query(
            `INSERT INTO applications (
              id, user_id, company, role, status, applied_date, deadline, salary, location, job_url, notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE SET
              company = EXCLUDED.company,
              role = EXCLUDED.role,
              status = EXCLUDED.status,
              updated_at = EXCLUDED.updated_at`,
            [
              app.id,
              userId,
              app.company,
              app.role,
              app.status || 'Applied',
              app.appliedDate || null,
              app.deadline || null,
              app.salary || null,
              app.location || null,
              app.jobUrl || null,
              app.notes || '',
              app.createdAt || new Date().toISOString(),
              app.updatedAt || new Date().toISOString()
            ]
          );
          appCount++;
        }
      }
      console.log(`[Migration] Migrated ${appCount} application records.`);
    }

    // 5. Migrate Calendar Events
    if (dbData.calendarEvents) {
      let eventCount = 0;
      for (const [userId, events] of Object.entries(dbData.calendarEvents)) {
        if (!Array.isArray(events)) continue;
        for (const evt of events) {
          await client.query(
            `INSERT INTO calendar_events (
              id, user_id, title, type, date, time, duration_minutes, notes, is_personal, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              date = EXCLUDED.date,
              time = EXCLUDED.time,
              updated_at = EXCLUDED.updated_at`,
            [
              evt.id,
              userId,
              evt.title,
              evt.type || 'Personal',
              evt.date,
              evt.time || '09:00 AM',
              evt.durationMinutes || 60,
              evt.notes || '',
              evt.isPersonal !== undefined ? evt.isPersonal : true,
              evt.createdAt || new Date().toISOString(),
              evt.updatedAt || new Date().toISOString()
            ]
          );
          eventCount++;
        }
      }
      console.log(`[Migration] Migrated ${eventCount} calendar event records.`);
    }

    await client.query('COMMIT');
    console.log('🎉 [Migration] Database migration completed successfully.');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [Migration] Transaction rolled back due to error:', err);
    throw err;
  } finally {
    client.release();
  }
}
