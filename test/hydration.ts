import { spawn, type ChildProcess } from 'node:child_process'
import { test } from '@substrate-system/tapzero'
import waitOn from '@substrate-system/wait-on'
import { chromium, type Browser, type Page } from 'playwright'

const PORT = 8888
const BASE_URL = `http://localhost:${PORT}`

let server:ChildProcess
let browser:Browser
let page:Page

test('setup -- start dev server and browser', async t => {
    server = spawn('npx', ['vite', 'dev', '--port', '' + PORT], {
        cwd: process.cwd(),
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'development' },
    })

    server.stderr?.on('data', (data:Buffer) => {
        const msg = data.toString()
        if (msg.includes('ERROR')) {
            console.error('[server]', msg)
        }
    })

    await waitOn({
        resources: [`http-get://localhost:${PORT}/health`],
        timeout: 30_000,
    })

    t.ok(true, 'dev server is ready')

    browser = await chromium.launch()
    page = await browser.newPage()
    t.ok(true, 'browser launched')
})

test('home route has SSR content before hydration', async t => {
    await page.goto(BASE_URL + '/')
    await page.waitForSelector('#root')

    const h1 = await page.textContent('h1')
    t.equal(h1, 'Example', 'renders app header')

    const h2 = await page.textContent('h2')
    t.equal(h2, 'counter', 'renders home route heading')

    const output = await page.textContent('output')
    t.ok(
        output?.includes('count: 0'),
        'counter starts at 0'
    )
})

test('hydration -- plus button increments counter', async t => {
    // wait for client JS to hydrate
    await page.waitForFunction(() => {
        const btn = document.querySelector('button.btn')
        return btn && !btn.hasAttribute('data-ssr')
    }, { timeout: 10_000 })

    const plusBtn = page.locator('button.btn', {
        hasText: 'plus',
    })

    await plusBtn.click()

    const output = page.locator('output')
    await output.filter({ hasText: 'count: 1' })
        .waitFor({ timeout: 5_000 })

    const text = await output.textContent()
    t.ok(
        text?.includes('count: 1'),
        'counter incremented to 1 after click'
    )
})

test(
    'hydration -- minus button decrements counter',
    async t => {
        const minusBtn = page.locator('button.btn', {
            hasText: 'minus',
        })

        await minusBtn.click()

        const output = page.locator('output')
        await output.filter({ hasText: 'count: 0' })
            .waitFor({ timeout: 5_000 })

        const text = await output.textContent()
        t.ok(
            text?.includes('count: 0'),
            'counter decremented back to 0'
        )
    }
)

test('hydration -- multiple clicks accumulate', async t => {
    const plusBtn = page.locator('button.btn', {
        hasText: 'plus',
    })
    const output = page.locator('output')

    // count is at 0 from the previous test
    await plusBtn.click()
    await plusBtn.click()

    await output.filter({ hasText: 'count: 2' })
        .waitFor({ timeout: 5_000 })

    const text = await output.textContent()
    t.ok(
        text?.includes('count: 2'),
        'multiple clicks accumulate correctly'
    )
})

test('teardown -- close browser and server', async t => {
    await page.close()
    await browser.close()
    server.kill('SIGTERM')
    t.ok(true, 'cleanup complete')
})
