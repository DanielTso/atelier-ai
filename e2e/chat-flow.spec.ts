import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test('app loads and shows textarea', async ({ page }) => {
    await page.goto('/')
    const textarea = page.getByPlaceholder(/type a message/i)
    await expect(textarea).toBeVisible()
  })

  test('textarea is always enabled and accepts input', async ({ page }) => {
    await page.goto('/')
    const textarea = page.getByPlaceholder(/type a message/i)
    await expect(textarea).toBeEnabled()
    await textarea.fill('Hello, world!')
    await expect(textarea).toHaveValue('Hello, world!')
  })

  test('send button is visible', async ({ page }) => {
    await page.goto('/')
    // The send button should exist in the form area
    const sendButton = page.locator('button[type="submit"], button:has(svg)').last()
    await expect(sendButton).toBeVisible()
  })
})
