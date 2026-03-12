// In-memory recording of RP sessions per channel.
// Messages are held here until /chronicle is called, then flushed to Claude.

export interface RecordedMessage {
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface EventSession {
  eventId: string; // Links to Event table in the app
  eventTitle: string;
  channelId: string;
  startedBy: string; // Discord user ID of the GM who started it
  startedAt: string;
  messages: RecordedMessage[];
}

// Active sessions keyed by channel ID
const sessions = new Map<string, EventSession>();

export function startSession(channelId: string, eventTitle: string, startedBy: string, eventId: string): EventSession {
  const session: EventSession = {
    eventId,
    eventTitle,
    channelId,
    startedBy,
    startedAt: new Date().toISOString(),
    messages: [],
  };
  sessions.set(channelId, session);
  return session;
}

export function getActiveSession(channelId: string): EventSession | undefined {
  return sessions.get(channelId);
}

export function recordMessage(channelId: string, msg: RecordedMessage) {
  const session = sessions.get(channelId);
  if (session) {
    session.messages.push(msg);
  }
}

export function endSession(channelId: string): EventSession | undefined {
  const session = sessions.get(channelId);
  if (session) {
    sessions.delete(channelId);
  }
  return session;
}

export function getActiveSessions(): Map<string, EventSession> {
  return sessions;
}
