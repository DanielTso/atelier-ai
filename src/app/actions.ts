'use server'

import { db } from '@/db'
import { projects, chats, messages } from '@/db/schema'
import { eq, desc, isNull } from 'drizzle-orm'

export async function getProjects() {
  return await db.select().from(projects).all()
}

export async function createProject(name: string) {
  return await db.insert(projects).values({ name }).returning()
}

export async function deleteProject(id: number) {
  return await db.delete(projects).where(eq(projects.id, id))
}

export async function getChats(projectId: number) {
  return await db.select().from(chats).where(eq(chats.projectId, projectId)).orderBy(desc(chats.createdAt)).all()
}

export async function getStandaloneChats() {
  return await db.select().from(chats).where(isNull(chats.projectId)).orderBy(desc(chats.createdAt)).all()
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
