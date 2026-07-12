import { test } from '@substrate-system/tapzero'
import { Window } from 'happy-dom'
import app from '../src/server/index.js'

interface InitialState {
    route:string;
    count:number;
}

const htmlShell = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1">
    <title>App</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`

test('client hydration preserves SSR markup and updates on client interactions',
    async t => {
        const html = await renderHtmlForRoute('/')
        installBrowserEnvironment(html, 'http://localhost/')

        const root = document.getElementById('root')
        if (!root) throw new Error('expected #root element from SSR HTML')

        const beforeState = readInitialState(document)
        const beforeHtml = root.innerHTML

        t.ok(beforeState, 'SSR includes serialized initial state')
        t.equal(beforeState?.route, '/',
            'SSR initial route reflects the requested page')
        t.ok(root.textContent?.includes('counter'),
            'SSR starts on the home counter route')

        await import('../src/client/index.js')

        t.equal(root.innerHTML, beforeHtml,
            'initial client boot keeps SSR markup unchanged')
        t.ok(root.textContent?.includes('counter'),
            'hydration preserves the server-rendered route')

        const plusButton = Array.from(document.querySelectorAll('button.btn'))
            .find(btn => btn.textContent?.trim() === 'plus')

        if (!(plusButton instanceof HTMLButtonElement)) {
            throw new Error('expected plus button on home route')
        }

        const countOutput = document.querySelector('output')
        if (!(countOutput instanceof HTMLOutputElement)) {
            throw new Error('expected counter output element')
        }

        t.ok(countOutput.textContent?.includes('count: 0'),
            'counter starts from hydrated state value')

        plusButton.dispatchEvent(new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        }))

        await waitFor(() => countOutput.textContent?.includes('count: 1') === true,
            'count should increment on client state update')

        t.ok(countOutput.textContent?.includes('count: 1'),
            'client-side state updates re-render the route')
    })

test('client-side navigation re-renders the matched route', async t => {
    // continues from the hydrated app set up in the previous test
    const root = document.getElementById('root')
    if (!root) throw new Error('expected #root element')

    const contactLink = document.querySelector('a[href="/contact"]')
    if (!(contactLink instanceof HTMLAnchorElement)) {
        throw new Error('expected contact nav link')
    }

    contactLink.dispatchEvent(new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
    }))

    await waitFor(() => !!root.querySelector('form'),
        'contact route should render after clicking its nav link')

    t.ok(root.querySelector('form'),
        'clicking a nav link renders the new route')
    t.ok(!root.querySelector('output'),
        'previous route content is replaced')
    t.equal(location.pathname, '/contact',
        'browser URL matches the new route')
})

async function renderHtmlForRoute (route: string): Promise<string> {
    const response = await app.fetch(
        new Request(`http://localhost${route}`),
        createTestEnv()
    )

    if (!response.ok) {
        throw new Error(`expected SSR response to succeed: ${response.status}`)
    }

    return await response.text()
}

function readInitialState (doc: Document): InitialState | null {
    const script = doc.getElementById('__INITIAL_STATE__')

    if (!script?.textContent) return null

    return JSON.parse(script.textContent) as InitialState
}

function installBrowserEnvironment (html:string, url:string):() => void {
    const browserWindow = new Window({ url })
    browserWindow.document.write(html)
    browserWindow.document.close()

    browserWindow.scrollTo = (() => {}) as typeof browserWindow.scrollTo

    const globalKeys = [
        'window',
        'document',
        'location',
        'history',
        'navigator',
        'localStorage',
        'sessionStorage',
        'Node',
        'Element',
        'HTMLElement',
        'HTMLAnchorElement',
        'HTMLButtonElement',
        'HTMLOutputElement',
        'CustomEvent',
        'Event',
        'MouseEvent',
        'Text',
        'FormData',
        'File',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'getComputedStyle',
    ] as const

    const previousValues = new Map<string, unknown>()
    const previousDescriptors = new Map<string, PropertyDescriptor | undefined>()

    for (const key of globalKeys) {
        previousValues.set(key, (globalThis as Record<string, unknown>)[key])
        previousDescriptors.set(
            key,
            Object.getOwnPropertyDescriptor(globalThis, key)
        )
    }

    const nextValues:Record<string, unknown> = {
        window: browserWindow,
        document: browserWindow.document,
        location: browserWindow.location,
        history: browserWindow.history,
        navigator: browserWindow.navigator,
        localStorage: browserWindow.localStorage,
        sessionStorage: browserWindow.sessionStorage,
        Node: browserWindow.Node,
        Element: browserWindow.Element,
        HTMLElement: browserWindow.HTMLElement,
        HTMLAnchorElement: browserWindow.HTMLAnchorElement,
        HTMLButtonElement: browserWindow.HTMLButtonElement,
        HTMLOutputElement: browserWindow.HTMLOutputElement,
        CustomEvent: browserWindow.CustomEvent,
        Event: browserWindow.Event,
        MouseEvent: browserWindow.MouseEvent,
        Text: browserWindow.Text,
        FormData: browserWindow.FormData,
        File: browserWindow.File,
        requestAnimationFrame:
            browserWindow.requestAnimationFrame.bind(browserWindow),
        cancelAnimationFrame:
            browserWindow.cancelAnimationFrame.bind(browserWindow),
        getComputedStyle: browserWindow.getComputedStyle.bind(browserWindow),
    }

    for (const [key, value] of Object.entries(nextValues)) {
        assignGlobal(key, value)
    }

    return function restoreEnvironment () {
        for (const key of globalKeys) {
            const previousDescriptor = previousDescriptors.get(key)

            if (previousDescriptor) {
                Object.defineProperty(globalThis, key, previousDescriptor)
                continue
            }

            const value = previousValues.get(key)

            if (value === undefined) {
                delete (globalThis as Record<string, unknown>)[key]
                continue
            }

            (globalThis as Record<string, unknown>)[key] = value
        }

        browserWindow.happyDOM.cancelAsync()
    }

    function assignGlobal (key: string, value: unknown): void {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)

        if (!descriptor) {
            Object.defineProperty(globalThis, key, {
                configurable: true,
                writable: true,
                value,
            })
            return
        }

        if (descriptor.writable === true) {
            (globalThis as Record<string, unknown>)[key] = value
            return
        }

        Object.defineProperty(globalThis, key, {
            configurable: true,
            writable: true,
            value,
        })
    }
}

async function waitFor (
    predicate: () => boolean,
    timeoutMessage: string
): Promise<void> {
    for (let i = 0; i < 20; i++) {
        if (predicate()) return
        await new Promise(resolve => setTimeout(resolve, 0))
    }

    throw new Error(timeoutMessage)
}

function createTestEnv (): Env {
    return {
        NODE_ENV: 'development',
        SESSION_SECRET: '0123456789abcdef0123456789abcdef',
        DB: {
            prepare () {
                return {
                    bind () {
                        return {
                            all: async () => ({ results: [] })
                        }
                    }
                }
            }
        } as unknown as D1Database,
        MY_DO: {
            getByName () {
                return {
                    sayHello: async () => 'Hello, World!',
                    startAuth: async () => 'https://example.com',
                    handleCallback: async () => ({ did: 'did:example:123' }),
                    post: async () => ({})
                }
            }
        } as unknown as Env['MY_DO'],
        ASSETS: {
            fetch: async (req:Request) => {
                const url = new URL(
                    typeof req === 'string' ? req : req.url
                )
                if (url.pathname === '/') {
                    return new Response(htmlShell, {
                        headers: {
                            'content-type': 'text/html'
                        }
                    })
                }
                return new Response('Not Found', {
                    status: 404
                })
            }
        } as unknown as Fetcher
    }
}
