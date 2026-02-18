-- ============================================================================
-- FreeLang SQLite Test Database Schema
-- ============================================================================
--
-- Purpose: Test database for freelancer platform
-- Tables: freelancers, projects, skills, project_freelancers
-- Sample data included
--

-- ============================================================================
-- Table: freelancers
-- Description: Freelancer profiles with ratings and hourly rates
-- ============================================================================

CREATE TABLE IF NOT EXISTS freelancers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  rating REAL NOT NULL DEFAULT 0.0,
  hourlyRate INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  completedProjects INTEGER DEFAULT 0,
  totalEarnings REAL DEFAULT 0.0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Table: projects
-- Description: Project listings with budgets and status
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  budget REAL NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  requiredSkills TEXT,
  durationDays INTEGER,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  assignedFreelancerId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME,
  FOREIGN KEY (assignedFreelancerId) REFERENCES freelancers(id)
);

-- ============================================================================
-- Table: skills
-- Description: Available skills for freelancers
-- ============================================================================

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Table: freelancer_skills
-- Description: Junction table for freelancer skills
-- ============================================================================

CREATE TABLE IF NOT EXISTS freelancer_skills (
  freelancerId INTEGER NOT NULL,
  skillId INTEGER NOT NULL,
  proficiency INTEGER DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  yearsOfExperience INTEGER DEFAULT 0,
  PRIMARY KEY (freelancerId, skillId),
  FOREIGN KEY (freelancerId) REFERENCES freelancers(id) ON DELETE CASCADE,
  FOREIGN KEY (skillId) REFERENCES skills(id) ON DELETE CASCADE
);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Skills
INSERT OR IGNORE INTO skills (id, name, category, level) VALUES
  (1, 'Python', 'Programming', 5),
  (2, 'JavaScript', 'Programming', 5),
  (3, 'TypeScript', 'Programming', 4),
  (4, 'React', 'Frontend', 5),
  (5, 'Node.js', 'Backend', 5),
  (6, 'SQL', 'Database', 4),
  (7, 'Docker', 'DevOps', 4),
  (8, 'AWS', 'Cloud', 4),
  (9, 'Machine Learning', 'AI', 3),
  (10, 'Data Analysis', 'Analytics', 4);

-- Freelancers
INSERT OR IGNORE INTO freelancers (id, name, email, rating, hourlyRate, status, completedProjects, totalEarnings) VALUES
  (1, '김준호', 'kim.junho@example.com', 4.9, 85, 'active', 45, 45000),
  (2, '이순신', 'lee.sunsin@example.com', 4.6, 65, 'active', 28, 28000),
  (3, '박민철', 'park.minchul@example.com', 4.7, 75, 'active', 30, 32500),
  (4, '최성호', 'choi.sungho@example.com', 5.0, 95, 'active', 12, 15000),
  (5, '장보고', 'jang.bogo@example.com', 4.5, 55, 'inactive', 18, 9900);

-- Freelancer Skills
INSERT OR IGNORE INTO freelancer_skills (freelancerId, skillId, proficiency, yearsOfExperience) VALUES
  -- 김준호: Python, JavaScript, React, Node.js
  (1, 1, 5, 8),
  (1, 2, 4, 6),
  (1, 4, 5, 5),
  (1, 5, 5, 5),

  -- 이순신: Python, SQL, Machine Learning
  (2, 1, 4, 5),
  (2, 6, 4, 4),
  (2, 9, 4, 3),

  -- 박민철: JavaScript, TypeScript, React, Docker
  (3, 2, 5, 7),
  (3, 3, 4, 4),
  (3, 4, 5, 6),
  (3, 7, 4, 3),

  -- 최성호: Node.js, AWS, Docker
  (4, 5, 5, 6),
  (4, 8, 5, 4),
  (4, 7, 4, 3),

  -- 장보고: Python, SQL, Data Analysis
  (5, 1, 3, 2),
  (5, 6, 3, 2),
  (5, 10, 4, 3);

-- Projects
INSERT OR IGNORE INTO projects (id, title, description, budget, status, requiredSkills, durationDays, difficulty, assignedFreelancerId) VALUES
  (1, 'E-commerce Platform', 'Full-stack e-commerce system with payment integration', 15000, 'in_progress', 'React,Node.js,SQL', 90, 'hard', 1),
  (2, 'Mobile App Development', 'React Native mobile application', 8000, 'open', 'React,TypeScript,JavaScript', 60, 'medium', NULL),
  (3, 'Data Analysis Dashboard', 'Analytics dashboard with Python backend', 5000, 'completed', 'Python,SQL,Data Analysis', 30, 'medium', 2),
  (4, 'API Server Migration', 'Migrate to microservices architecture', 12000, 'in_progress', 'Node.js,Docker,AWS', 45, 'hard', 4),
  (5, 'System Audit', 'Code review and optimization audit', 3000, 'open', 'Python,JavaScript', 20, 'easy', NULL);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_freelancers_rating ON freelancers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_freelancers_hourlyRate ON freelancers(hourlyRate);
CREATE INDEX IF NOT EXISTS idx_freelancers_status ON freelancers(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget);
CREATE INDEX IF NOT EXISTS idx_projects_difficulty ON projects(difficulty);
CREATE INDEX IF NOT EXISTS idx_freelancer_skills ON freelancer_skills(freelancerId, skillId);

-- ============================================================================
-- Common Test Queries
-- ============================================================================

-- Query 1: Top rated freelancers
-- SELECT name, rating, hourlyRate FROM freelancers
-- WHERE rating > 4.7 ORDER BY rating DESC LIMIT 10;

-- Query 2: Active high-budget projects
-- SELECT title, budget, status FROM projects
-- WHERE status = 'in_progress' AND budget > 10000 ORDER BY budget DESC;

-- Query 3: Freelancers with specific skill
-- SELECT f.name, f.rating FROM freelancers f
-- JOIN freelancer_skills fs ON f.id = fs.freelancerId
-- JOIN skills s ON fs.skillId = s.id
-- WHERE s.name = 'React' ORDER BY f.rating DESC;

-- Query 4: Project completion rate
-- SELECT name, completedProjects,
--        ROUND(completedProjects * 1.0 / (completedProjects + 1), 2) as completion_rate
-- FROM freelancers WHERE status = 'active';

-- Query 5: Expensive freelancers
-- SELECT name, hourlyRate, totalEarnings FROM freelancers
-- WHERE hourlyRate > 70 ORDER BY hourlyRate DESC;

