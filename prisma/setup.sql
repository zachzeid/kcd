-- Kanar Character Checkout Database Setup
-- Run: sqlite3 prisma/dev.db < prisma/setup.sql

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  hashedPassword TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Character (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  inactive INTEGER NOT NULL DEFAULT 0,
  reviewNotes TEXT,
  reviewedBy TEXT,
  reviewedAt DATETIME,
  submittedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS Character_userId_idx ON Character(userId);
CREATE INDEX IF NOT EXISTS Character_status_idx ON Character(status);

CREATE TABLE IF NOT EXISTS Event (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATETIME NOT NULL,
  endDate DATETIME,
  location TEXT,
  description TEXT,
  ticketPriceA INTEGER NOT NULL DEFAULT 3500,
  ticketPriceB INTEGER NOT NULL DEFAULT 4500,
  dayPassPrice INTEGER NOT NULL DEFAULT 2000,
  status TEXT NOT NULL DEFAULT 'upcoming',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS EventRegistration (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  eventId TEXT NOT NULL,
  characterId TEXT,
  ticketType TEXT NOT NULL,
  amountPaid INTEGER NOT NULL DEFAULT 0,
  paymentStatus TEXT NOT NULL DEFAULT 'unpaid',
  arfSignedAt DATETIME,
  arfYear INTEGER,
  checkedInAt DATETIME,
  checkedOutAt DATETIME,
  xpEarned INTEGER NOT NULL DEFAULT 0,
  npcMinutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE,
  UNIQUE(userId, eventId)
);

CREATE INDEX IF NOT EXISTS EventRegistration_eventId_idx ON EventRegistration(eventId);
CREATE INDEX IF NOT EXISTS EventRegistration_userId_idx ON EventRegistration(userId);

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  characterId TEXT NOT NULL,
  actorId TEXT NOT NULL,
  actorName TEXT NOT NULL,
  actorRole TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (characterId) REFERENCES Character(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS AuditLog_characterId_idx ON AuditLog(characterId);
CREATE INDEX IF NOT EXISTS AuditLog_actorId_idx ON AuditLog(actorId);

CREATE TABLE IF NOT EXISTS LoreEntry (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  sourceUrl TEXT,
  date TEXT,
  year INTEGER,
  month INTEGER,
  locations TEXT,
  characters TEXT,
  tags TEXT,
  category TEXT NOT NULL DEFAULT 'story',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS LoreEntry_year_idx ON LoreEntry(year);
CREATE INDEX IF NOT EXISTS LoreEntry_category_idx ON LoreEntry(category);

CREATE TABLE IF NOT EXISTS LoreCharacter (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  title TEXT,
  race TEXT,
  class TEXT,
  faction TEXT,
  description TEXT,
  firstMentioned TEXT,
  assignedToId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS LoreCharacter_assignedToId_idx ON LoreCharacter(assignedToId);

CREATE TABLE IF NOT EXISTS CharacterSignOut (
  id TEXT PRIMARY KEY,
  characterId TEXT NOT NULL,
  userId TEXT NOT NULL,
  eventId TEXT NOT NULL,
  registrationId TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  npcMinutes INTEGER NOT NULL DEFAULT 0,
  npcDetails TEXT,
  staffMinutes INTEGER NOT NULL DEFAULT 0,
  staffDetails TEXT,
  lifeCreditsLost INTEGER NOT NULL DEFAULT 0,
  skillsLearned TEXT,
  skillsTaught TEXT,
  eventRating INTEGER,
  roleplayQuality TEXT,
  enjoyedEncounters TEXT,
  dislikedEncounters TEXT,
  notableRoleplay TEXT,
  atmosphereFeedback TEXT,
  betweenEventAction TEXT NOT NULL DEFAULT 'nothing',
  betweenEventDetails TEXT,
  processedBy TEXT,
  processedAt DATETIME,
  processNotes TEXT,
  xpAwarded INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (characterId) REFERENCES Character(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE,
  FOREIGN KEY (registrationId) REFERENCES EventRegistration(id) ON DELETE CASCADE,
  UNIQUE(characterId, eventId)
);

CREATE INDEX IF NOT EXISTS CharacterSignOut_eventId_idx ON CharacterSignOut(eventId);
CREATE INDEX IF NOT EXISTS CharacterSignOut_userId_idx ON CharacterSignOut(userId);
CREATE INDEX IF NOT EXISTS CharacterSignOut_status_idx ON CharacterSignOut(status);

CREATE TABLE IF NOT EXISTS ItemSubmission (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  characterId TEXT NOT NULL,
  eventId TEXT,
  itemType TEXT NOT NULL,
  itemName TEXT NOT NULL,
  itemDescription TEXT,
  craftingSkill TEXT NOT NULL,
  craftingLevel INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  craftingTime TEXT,
  primaryMaterial TEXT,
  secondaryMaterial TEXT,
  masterCrafted INTEGER NOT NULL DEFAULT 0,
  extraDetails TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processedBy TEXT,
  processedAt DATETIME,
  processNotes TEXT,
  tagIssued INTEGER NOT NULL DEFAULT 0,
  tagCode INTEGER UNIQUE,
  tagImageUrl TEXT,
  printedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (characterId) REFERENCES Character(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES Event(id)
);

CREATE INDEX IF NOT EXISTS ItemSubmission_userId_idx ON ItemSubmission(userId);
CREATE INDEX IF NOT EXISTS ItemSubmission_characterId_idx ON ItemSubmission(characterId);
CREATE INDEX IF NOT EXISTS ItemSubmission_status_idx ON ItemSubmission(status);
CREATE INDEX IF NOT EXISTS ItemSubmission_itemType_idx ON ItemSubmission(itemType);

CREATE TABLE IF NOT EXISTS PlayerBank (
  id TEXT PRIMARY KEY,
  characterId TEXT UNIQUE NOT NULL,
  balance INTEGER NOT NULL DEFAULT 5000,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (characterId) REFERENCES Character(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BankTransaction (
  id TEXT PRIMARY KEY,
  bankId TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  eventId TEXT,
  processedBy TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bankId) REFERENCES PlayerBank(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS BankTransaction_bankId_idx ON BankTransaction(bankId);
