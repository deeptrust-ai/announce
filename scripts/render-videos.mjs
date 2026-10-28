#!/usr/bin/env node
/** Export the full DOM + WebGL compositions with a deterministic frame clock.
 * Requires Playwright (or PLAYWRIGHT_MODULE), Chrome, and ffmpeg.
 * Uses the existing dev server; never starts or stops it.
 */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, access, rename, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.RENDER_BASE_URL || 'http://localhost:5173'
const outputDirectory = process.env.RENDER_OUTPUT_DIR || path.join(homedir(), 'Desktop')
const width = 1920, height = 1080, fps = 30, finalHold = 4
await mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--force-color-profile=srgb', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
})

async function availableFilename(name) {
  let filename = path.join(outputDirectory, name + '.mp4')
  try {
    await access(filename)
    filename = path.join(outputDirectory, name + '-' + Date.now() + '.mp4')
  } catch {}
  return filename
}

const clock = () => {
  let id = 0, time = 0
  const queue = new Map()
  window.requestAnimationFrame = (callback) => { queue.set(++id, callback); return id }
  window.cancelAnimationFrame = (handle) => { queue.delete(handle) }
  Object.defineProperty(performance, 'now', { configurable: true, value: () => time })
  window.__videoFrame = async (timestamp) => {
    time = timestamp
    const callbacks = [...queue.values()]
    queue.clear()
    for (const callback of callbacks) callback(time)
    // Svelte's announcement styles must commit before the compositor is captured.
    await Promise.resolve()
    await Promise.resolve()
  }
}

try {
  for (const kind of ['doppel', 'keycard']) {
    const filename = await availableFilename(`DeepTrust-${kind === 'doppel' ? 'Doppel' : 'Keycard'}-16x9`)
    const temporary = filename.replace(/\.mp4$/, '.rendering.mp4')
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'no-preference', colorScheme: 'dark' })
    await context.addInitScript(clock)
    const page = await context.newPage()
    await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204, body: '' }))
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
    })
    page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`) })
    page.on('requestfailed', (request) => errors.push(`Request failed: ${request.url()}`))
    await page.goto(`${base}/${kind}/`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForFunction(() => document.querySelector('nav button[aria-label^="Restart"]')?.disabled === false, undefined, { polling: 100, timeout: 60000 })
    await page.evaluate(() => document.fonts.ready)
    await page.addStyleTag({ content: '.transition-controls, .playback { display: none !important; } canvas { outline: none !important; } * { cursor: none !important; }' })
    const duration = await page.evaluate(async (variant) => {
      if (variant === 'doppel') return (await import('/src/lib/timeline.ts')).SCENE_DURATION
      const { KEYCARD_STAGES } = await import('/src/lib/keycard-scene.ts')
      const { ANNOUNCEMENT_DURATION } = await import('/src/lib/announcement.ts')
      return KEYCARD_STAGES.find((stage) => stage.id === 'announcement').start + ANNOUNCEMENT_DURATION
    }, kind)
    const client = await context.newCDPSession(page)
    const total = Math.ceil((duration + finalHold) * fps)
    const encoder = spawn(process.env.FFMPEG_PATH || 'ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0',
      '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', '-n', temporary,
    ], { stdio: ['pipe', 'ignore', 'pipe'] })
    let encoderErrors = ''
    encoder.stderr.on('data', (data) => { encoderErrors += data.toString() })
    const finished = once(encoder, 'close')
    encoder.stdin.on('error', (error) => { errors.push(error.message) })
    console.log(`Rendering ${kind}: ${width}×${height}, ${fps} fps, ${total} frames (${(total / fps).toFixed(2)} seconds).`)
    try {
      for (let index = 0; index < total; index++) {
        await page.evaluate((time) => window.__videoFrame(time), index * 1000 / fps)
        if (errors.length) throw new Error(errors.join('\n'))
        const { data } = await client.send('Page.captureScreenshot', {
          format: 'jpeg', quality: 96, fromSurface: true, captureBeyondViewport: false,
          clip: { x: 0, y: 0, width, height, scale: 1 },
        })
        if (!encoder.stdin.write(Buffer.from(data, 'base64'))) await once(encoder.stdin, 'drain')
        if (index % 60 === 0 || index === total - 1) console.log(`${kind}: frame ${index + 1}/${total}`)
      }
      encoder.stdin.end()
      const [exitCode] = await finished
      if (exitCode !== 0) throw new Error(`ffmpeg failed: ${encoderErrors}`)
      await rename(temporary, filename)
      console.log(`Saved: ${filename}`)
    } catch (error) {
      encoder.kill('SIGTERM')
      await finished.catch(() => {})
      await unlink(temporary).catch(() => {})
      throw error
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
