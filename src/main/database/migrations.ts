import { Database as SqlJsDatabase } from 'sql.js'

export function runMigrations(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      google_place_id TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      website TEXT,
      has_website INTEGER NOT NULL DEFAULT 0,
      address TEXT,
      lat REAL,
      lng REAL,
      rating REAL,
      rating_count INTEGER,
      types TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      priority TEXT NOT NULL DEFAULT 'medium',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      type TEXT NOT NULL,
      outcome TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL DEFAULT 'Broker',
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_activity_date TEXT,
      total_calls INTEGER NOT NULL DEFAULT 0,
      total_emails INTEGER NOT NULL DEFAULT 0,
      total_meetings INTEGER NOT NULL DEFAULT 0,
      total_deals INTEGER NOT NULL DEFAULT 0,
      total_leads INTEGER NOT NULL DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      category TEXT,
      requirement INTEGER NOT NULL DEFAULT 0,
      unlocked INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT,
      progress INTEGER NOT NULL DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      calls INTEGER NOT NULL DEFAULT 0,
      emails INTEGER NOT NULL DEFAULT 0,
      meetings INTEGER NOT NULL DEFAULT 0,
      deals INTEGER NOT NULL DEFAULT 0,
      xp_earned INTEGER NOT NULL DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  db.run(`INSERT OR IGNORE INTO user_profile (id, username) VALUES (1, 'Broker')`)

  // AI Agents tables
  db.run(`
    CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      target_url TEXT NOT NULL,
      brand_analysis TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      active INTEGER NOT NULL DEFAULT 1
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      target_url TEXT NOT NULL,
      brand_analysis TEXT,
      prospect TEXT,
      crafted_message TEXT,
      error TEXT,
      approved INTEGER,
      message_sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES agent_sessions(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS linkedin_cookies (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      cookies TEXT NOT NULL,
      user_agent TEXT,
      logged_in_at TEXT NOT NULL DEFAULT (datetime('now')),
      valid INTEGER NOT NULL DEFAULT 1
    )
  `)

  // Outreach tracking — records every message sent so we can detect responses
  db.run(`
    CREATE TABLE IF NOT EXISTS sent_outreach (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      agent_id TEXT NOT NULL,
      prospect_name TEXT NOT NULL,
      prospect_title TEXT,
      prospect_company TEXT,
      prospect_profile_url TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      response_detected INTEGER NOT NULL DEFAULT 0,
      response_snippet TEXT,
      response_detected_at TEXT,
      read INTEGER NOT NULL DEFAULT 0
    )
  `)

  // Lead intelligence briefs — cached AI research per lead
  db.run(`
    CREATE TABLE IF NOT EXISTS lead_intel (
      lead_id TEXT PRIMARY KEY,
      brief TEXT NOT NULL,
      talking_points TEXT NOT NULL,
      pain_points TEXT NOT NULL,
      suggested_approach TEXT NOT NULL,
      competitive_angle TEXT,
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `)

  // Owner discovery cache — cached AI-identified owner info per lead
  db.run(`
    CREATE TABLE IF NOT EXISTS owner_discovery (
      lead_id TEXT PRIMARY KEY,
      owner_name TEXT,
      owner_title TEXT,
      owner_phone TEXT,
      owner_email TEXT,
      confidence TEXT NOT NULL DEFAULT 'none',
      discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `)

  // Indexes for query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`)
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_google_place_id ON leads(google_place_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_agent_runs_session_id ON agent_runs(session_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON agent_runs(agent_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_sent_outreach_profile ON sent_outreach(prospect_profile_url)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_sent_outreach_response ON sent_outreach(response_detected)`)

  // Add total_leads column for existing databases (safe migration)
  try {
    db.run(`ALTER TABLE user_profile ADD COLUMN total_leads INTEGER NOT NULL DEFAULT 0`)
  } catch {
    // Column already exists — ignore
  }

  // Add owner fields to leads table (safe migration)
  const ownerColumns = ['owner_name TEXT', 'owner_title TEXT', 'owner_phone TEXT', 'owner_email TEXT']
  for (const col of ownerColumns) {
    try {
      db.run(`ALTER TABLE leads ADD COLUMN ${col}`)
    } catch {
      // Column already exists — ignore
    }
  }

  // ── Phase 1: My Product ──
  db.run(`
    CREATE TABLE IF NOT EXISTS my_product (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      product_name TEXT DEFAULT '',
      company_name TEXT DEFAULT '',
      product_type TEXT DEFAULT '',
      elevator_pitch TEXT DEFAULT '',
      key_benefits TEXT DEFAULT '[]',
      target_industries TEXT DEFAULT '[]',
      target_business_sizes TEXT DEFAULT '',
      price_range TEXT DEFAULT '',
      unique_selling_points TEXT DEFAULT '[]',
      common_objections TEXT DEFAULT '[]',
      competitors TEXT DEFAULT '[]',
      ideal_customer_description TEXT DEFAULT '',
      website TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // ── Phase 2: Call Mode ──
  db.run(`
    CREATE TABLE IF NOT EXISTS call_sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      mode TEXT DEFAULT 'normal',
      calls_made INTEGER DEFAULT 0,
      calls_answered INTEGER DEFAULT 0,
      meetings_booked INTEGER DEFAULT 0,
      total_duration_seconds INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS call_prep (
      lead_id TEXT PRIMARY KEY,
      opener TEXT,
      talking_points TEXT,
      objection_cards TEXT,
      why_now TEXT,
      product_fit TEXT,
      generated_at TEXT DEFAULT (datetime('now')),
      product_hash TEXT,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `)

  // ── Phase 3: Follow-Up Cadence Engine ──
  db.run(`
    CREATE TABLE IF NOT EXISTS cadence_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      cadence_id TEXT,
      step_index INTEGER DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'call',
      due_date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      skipped INTEGER DEFAULT 0,
      completed_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_ups(due_date)`)

  // Seed default cadence templates
  db.run(`INSERT OR IGNORE INTO cadence_templates (id, name, description, steps) VALUES
    ('cadence_new_lead', 'New Lead', 'Standard outreach for new leads', '${JSON.stringify([
      { day: 0, type: 'call', note: 'Initial call' },
      { day: 3, type: 'email', note: 'Follow-up email if no answer' },
      { day: 7, type: 'call', note: 'Second call attempt' },
      { day: 14, type: 'email', note: 'Value-add email' },
      { day: 21, type: 'call', note: 'Final attempt' }
    ])}'),
    ('cadence_interested', 'Interested Lead', 'Nurture sequence for interested prospects', '${JSON.stringify([
      { day: 1, type: 'email', note: 'Send proposal/info' },
      { day: 3, type: 'call', note: 'Follow up on proposal' },
      { day: 7, type: 'call', note: 'Check in' },
      { day: 14, type: 'email', note: 'Case study / social proof' }
    ])}'),
    ('cadence_no_answer', 'No Answer', 'Persistent follow-up for unreachable leads', '${JSON.stringify([
      { day: 1, type: 'call', note: 'Try again' },
      { day: 3, type: 'call', note: 'Different time of day' },
      { day: 5, type: 'email', note: 'Email introduction' },
      { day: 10, type: 'call', note: 'Final call attempt' }
    ])}')
  `)

  // ── Phase 4: Call Scripts + Objection Playbook ──
  db.run(`
    CREATE TABLE IF NOT EXISTS call_scripts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT DEFAULT '',
      business_type TEXT DEFAULT '',
      script_body TEXT NOT NULL DEFAULT '',
      usage_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS objection_playbook (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL DEFAULT 'general',
      objection TEXT NOT NULL,
      response TEXT NOT NULL,
      usage_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // ── Phase 5: Enhanced Analytics ──
  try {
    db.run(`ALTER TABLE activities ADD COLUMN deal_value REAL`)
  } catch {
    // Column already exists
  }

  // ── Phase 6: Upgraded Gamification ──
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_count INTEGER NOT NULL,
      current_count INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      xp_reward INTEGER DEFAULT 50,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS weekly_goals (
      id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      goal_type TEXT NOT NULL,
      target INTEGER NOT NULL,
      current INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_weekly_goals_week ON weekly_goals(week_start)`)

  // Add gamification columns for existing databases
  const profileColumns = ['total_revenue REAL DEFAULT 0', 'power_hours_completed INTEGER DEFAULT 0', 'longest_streak INTEGER DEFAULT 0']
  for (const col of profileColumns) {
    try {
      db.run(`ALTER TABLE user_profile ADD COLUMN ${col}`)
    } catch {
      // Column already exists
    }
  }

  // ── Phase 7: Email Templates ──
  db.run(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scenario TEXT NOT NULL DEFAULT 'general',
      subject_line TEXT DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      usage_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sent_emails (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      template_id TEXT,
      subject TEXT DEFAULT '',
      body TEXT NOT NULL,
      scenario TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `)
}
