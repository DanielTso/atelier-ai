'use server'

import { db } from '@/db'
import { projects, chats, messages, settings } from '@/db/schema'
import { eq, desc, isNull, isNotNull, and, gt, asc, count, inArray } from 'drizzle-orm'

export async function getProjects() {
  return await db.select().from(projects).all()
}

export async function createProject(name: string) {
  return await db.insert(projects).values({ name }).returning()
}

export async function deleteProject(id: number) {
  return await db.delete(projects).where(eq(projects.id, id))
}

export async function updateProjectName(id: number, name: string) {
  return await db.update(projects).set({ name }).where(eq(projects.id, id)).returning()
}

export async function getChats(projectId: number) {
  return await db.select().from(chats).where(
    and(eq(chats.projectId, projectId), eq(chats.archived, false))
  ).orderBy(desc(chats.createdAt)).all()
}

export async function getAllProjectChats() {
  // Get all non-archived chats that belong to a project
  return await db.select().from(chats).where(
    and(isNotNull(chats.projectId), eq(chats.archived, false))
  ).orderBy(desc(chats.createdAt)).all()
}

export async function getStandaloneChats() {
  return await db.select().from(chats).where(
    and(isNull(chats.projectId), eq(chats.archived, false))
  ).orderBy(desc(chats.createdAt)).all()
}

export async function createChat(projectId: number, title: string) {
  return await db.insert(chats).values({ projectId, title }).returning()
}

export async function createStandaloneChat(title: string) {
  return await db.insert(chats).values({ projectId: null, title }).returning()
}

export async function deleteChat(id: number) {
  return await db.delete(chats).where(eq(chats.id, id))
}

export async function updateChatTitle(id: number, title: string) {
  return await db.update(chats).set({ title }).where(eq(chats.id, id)).returning()
}

export async function saveMessage(chatId: number, role: string, content: string) {
  return await db.insert(messages).values({ chatId, role, content }).returning()
}

export async function deleteMessage(id: number) {
  return await db.delete(messages).where(eq(messages.id, id))
}

export async function getChatMessages(chatId: number, limit: number = 100) {
  // Limit messages to improve performance on large chats
  // Load most recent messages by ordering by createdAt DESC and limiting, then reverse
  const recentMessages = await db.select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .all()

  // Reverse to get chronological order (oldest first)
  return recentMessages.reverse()
}

export async function moveChatToProject(chatId: number, projectId: number | null) {
  return await db.update(chats).set({ projectId }).where(eq(chats.id, chatId)).returning()
}

export async function archiveChat(id: number) {
  return await db.update(chats).set({ archived: true }).where(eq(chats.id, id)).returning()
}

export async function restoreChat(id: number) {
  return await db.update(chats).set({ archived: false }).where(eq(chats.id, id)).returning()
}

export async function getArchivedChats() {
  return await db.select().from(chats).where(eq(chats.archived, true)).orderBy(desc(chats.createdAt)).all()
}

// Context Management Actions

export async function getChatWithContext(chatId: number) {
  // Get chat with summary and system prompt for context building
  const result = await db.select().from(chats).where(eq(chats.id, chatId)).get()
  return result
}

// Alias for backward compatibility
export async function getChatWithSummary(chatId: number) {
  return getChatWithContext(chatId)
}

export async function updateChatSystemPrompt(chatId: number, systemPrompt: string | null) {
  return await db.update(chats)
    .set({ systemPrompt })
    .where(eq(chats.id, chatId))
    .returning()
}

export async function updateChatSummary(chatId: number, summary: string, summaryUpToMessageId: number) {
  return await db.update(chats)
    .set({ summary, summaryUpToMessageId })
    .where(eq(chats.id, chatId))
    .returning()
}

export async function getMessageCount(chatId: number) {
  const result = await db.select({ count: count() })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .get()
  return result?.count ?? 0
}

export async function getMessagesForSummarization(chatId: number, upToMessageId: number) {
  // Get messages up to (and including) the specified message ID for summarization
  // These are the older messages that will be compressed into a summary
  const result = await db.select()
    .from(messages)
    .where(and(
      eq(messages.chatId, chatId),
      // Include messages with ID <= upToMessageId
    ))
    .orderBy(asc(messages.createdAt))
    .all()

  // Filter to only include messages up to the cutoff point
  return result.filter(m => m.id <= upToMessageId)
}

export async function getRecentMessagesAfterSummary(chatId: number, afterMessageId: number | null) {
  // Get messages after the summary point (these stay in full detail)
  if (afterMessageId === null) {
    // No summary yet, return all messages
    return await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .all()
  }

  return await db.select()
    .from(messages)
    .where(and(
      eq(messages.chatId, chatId),
      gt(messages.id, afterMessageId)
    ))
    .orderBy(asc(messages.createdAt))
    .all()
}

// Settings Actions

export async function getSetting(key: string) {
  const result = await db.select().from(settings).where(eq(settings.key, key)).get()
  return result?.value ?? null
}

export async function getSettings(keys: string[]) {
  if (keys.length === 0) return {}
  const results = await db.select().from(settings).where(inArray(settings.key, keys)).all()
  const map: Record<string, string> = {}
  for (const row of results) {
    map[row.key] = row.value
  }
  return map
}

export async function setSetting(key: string, value: string) {
  return await db.insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } })
    .returning()
}

export async function setSettings(entries: { key: string; value: string }[]) {
  const results = []
  for (const entry of entries) {
    const result = await db.insert(settings)
      .values({ key: entry.key, value: entry.value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settings.key, set: { value: entry.value, updatedAt: new Date() } })
      .returning()
    results.push(result)
  }
  return results
}
