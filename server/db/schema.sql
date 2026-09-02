-- ============================================================================
-- NOVARA v1.0 Production Relational Database Schema (PostgreSQL)
-- Enterprise-grade constraints, indexes, foreign keys, and user data isolation
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    avatar VARCHAR(16) DEFAULT 'NV',
    picture TEXT,
    target_role VARCHAR(255) DEFAULT 'Software Engineer',
    daily_study_minutes INTEGER DEFAULT 180 CHECK (daily_study_minutes > 0),
    placement_target_date DATE DEFAULT '2026-11-20',
    current_prep_level VARCHAR(64) DEFAULT 'Intermediate',
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 3. PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);

-- 4. ROADMAPS TABLE
CREATE TABLE IF NOT EXISTS roadmaps (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    source VARCHAR(64) DEFAULT 'custom_upload',
    total_hours INTEGER DEFAULT 100,
    summary TEXT,
    raw_roadmap_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);

-- 5. ROADMAP PHASES TABLE
CREATE TABLE IF NOT EXISTS roadmap_phases (
    id VARCHAR(64) PRIMARY KEY,
    roadmap_id VARCHAR(64) NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phase_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) DEFAULT 'upcoming',
    estimated_hours INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_phases_roadmap_id ON roadmap_phases(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_phases_user_id ON roadmap_phases(user_id);

-- 6. ROADMAP TOPICS TABLE
CREATE TABLE IF NOT EXISTS roadmap_topics (
    id VARCHAR(64) PRIMARY KEY,
    phase_id VARCHAR(64) NOT NULL REFERENCES roadmap_phases(id) ON DELETE CASCADE,
    roadmap_id VARCHAR(64) NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    difficulty VARCHAR(32) DEFAULT 'Medium',
    status VARCHAR(32) DEFAULT 'upcoming',
    target_problems INTEGER DEFAULT 10,
    completed_problems INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON roadmap_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_phase_id ON roadmap_topics(phase_id);

-- 7. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roadmap_id VARCHAR(64) REFERENCES roadmaps(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    category VARCHAR(64) NOT NULL,
    topic_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    priority VARCHAR(32) DEFAULT 'Medium',
    type VARCHAR(32) DEFAULT 'practice',
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    subtasks JSONB DEFAULT '[]'::jsonb,
    problem_links JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(user_id, completed);

-- 8. STREAKS TABLE
CREATE TABLE IF NOT EXISTS streaks (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    today_target_met BOOLEAN DEFAULT FALSE,
    last_completed_date DATE,
    freeze_count INTEGER DEFAULT 2,
    completed_days INTEGER DEFAULT 0,
    weekly_history JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. FOCUS SESSIONS TABLE
CREATE TABLE IF NOT EXISTS focus_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    paused_at TIMESTAMP WITH TIME ZONE,
    resumed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    abandoned_at TIMESTAMP WITH TIME ZONE,
    planned_minutes INTEGER NOT NULL,
    actual_minutes INTEGER DEFAULT 0,
    pause_history JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_focus_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_status ON focus_sessions(user_id, status);

-- 10. REVISION ITEMS TABLE
CREATE TABLE IF NOT EXISTS revision_items (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id VARCHAR(64),
    topic VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    stage INTEGER DEFAULT 1,
    easiness_factor NUMERIC(4, 2) DEFAULT 2.50,
    interval_days INTEGER DEFAULT 1,
    repetition_number INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review_date DATE NOT NULL,
    retention_score INTEGER DEFAULT 80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_revisions_user_due ON revision_items(user_id, next_review_date);

-- 11. REVISION ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS revision_attempts (
    id VARCHAR(64) PRIMARY KEY,
    revision_id VARCHAR(64) NOT NULL REFERENCES revision_items(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score_percent INTEGER NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
    duration_minutes INTEGER DEFAULT 0,
    answers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rev_attempts_user_id ON revision_attempts(user_id);

-- 12. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'Applied',
    applied_date DATE DEFAULT CURRENT_DATE,
    deadline DATE,
    salary VARCHAR(128),
    location VARCHAR(255),
    job_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(user_id, status);

-- 13. INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS interviews (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL DEFAULT 'Technical',
    title VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    interviewer VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(64) DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_interviews_user_app ON interviews(user_id, application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON interviews(user_id, scheduled_at);

-- 14. CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL DEFAULT 'Personal',
    date DATE NOT NULL,
    time VARCHAR(32) DEFAULT '09:00 AM',
    duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes >= 0),
    notes TEXT,
    is_personal BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id, date);

-- 15. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(64) DEFAULT 'reminder',
    time_text VARCHAR(64) DEFAULT 'Just now',
    unread BOOLEAN DEFAULT TRUE,
    action_tab VARCHAR(64) DEFAULT 'today',
    target_id VARCHAR(64),
    dedup_key VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, unread);
CREATE INDEX IF NOT EXISTS idx_notifications_dedup ON notifications(user_id, dedup_key);

-- 16. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_plan_reminder BOOLEAN DEFAULT TRUE,
    study_session_reminder BOOLEAN DEFAULT TRUE,
    unfinished_task_reminder BOOLEAN DEFAULT TRUE,
    streak_risk_reminder BOOLEAN DEFAULT TRUE,
    revision_reminder BOOLEAN DEFAULT TRUE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    preferred_reminder_times JSONB DEFAULT '{"morning":"08:00","evening":"18:00"}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. READINESS METRICS TABLE
CREATE TABLE IF NOT EXISTS readiness (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    benchmark_label VARCHAR(64) DEFAULT 'New Student',
    categories JSONB DEFAULT '[]'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. SYNC OPERATIONS (IDEMPOTENCY LEDGER)
CREATE TABLE IF NOT EXISTS sync_operations (
    operation_id VARCHAR(128) NOT NULL,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    operation VARCHAR(32) NOT NULL,
    payload JSONB,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, operation_id)
);
CREATE INDEX IF NOT EXISTS idx_sync_ops_processed ON sync_operations(user_id, processed_at);

-- 19. COACH SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS coach_snapshots (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    readiness_percent INTEGER DEFAULT 0 CHECK (readiness_percent >= 0 AND readiness_percent <= 100),
    target_role VARCHAR(255) NOT NULL,
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coach_user_id ON coach_snapshots(user_id, created_at DESC);

-- 20. MOCK INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS mock_interviews (
    interview_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    difficulty VARCHAR(32) NOT NULL,
    question_count INTEGER NOT NULL,
    status VARCHAR(32) DEFAULT 'in_progress',
    score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    questions JSONB DEFAULT '[]'::jsonb,
    feedback JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user ON mock_interviews(user_id, started_at DESC);

-- 21. UPLOADED ROADMAP FILES TABLE
CREATE TABLE IF NOT EXISTS uploaded_files (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_key VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
    storage_provider VARCHAR(64) DEFAULT 'local',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user ON uploaded_files(user_id);

-- 22. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS analytics_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type, created_at);
