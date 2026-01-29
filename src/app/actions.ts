'use server'

import { db } from '@/db'
import { projects, chats, messages } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

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

export async function createChat(projectId: number, title: string) {
  return await db.insert(chats).values({ projectId, title }).returning()
}

export async function deleteChat(id: number) {
  return await db.delete(chats).where(eq(chats.id, id))
}

export async function saveMessage(chatId: number, role: string, content: string) {
  return await db.insert(messages).values({ chatId, role, content }).returning()
}

export async function getChatMessages(chatId: number) {
  return await db.select().from(messages).where(eq(messages.chatId, chatId)).all()
}
