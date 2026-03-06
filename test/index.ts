import { test } from '@substrate-system/tapzero'
import app from '../src/server/index.js'

interface InitialState {
    route: string;
    count: number;
}

test('server-side render returns full HTML for the home route', async t => {
    const response = await app.fetch(
        new Request('http://localhost/'),
        createTestEnv()
    )

    t.equal(response.status, 200, 'returns 200 status')

    const html = await response.text()
    t.ok(html.startsWith('<!doctype html>'), 'returns an HTML document')
    t.ok(html.includes('<h1>Example</h1>'), 'renders app shell header')
    t.ok(html.includes('<h2>counter</h2>'), 'renders home route content')
    t.ok(html.includes('<a href="/">home</a>'), 'renders home nav link')
    t.ok(html.includes('<a href="/contact">contact</a>'),
        'renders contact nav link')

    const state = readInitialState(html)
    t.ok(state, 'embeds serialized initial state')

    if (!state) return
    t.deepEqual(state, { route: '/', count: 0 },
        'initial state matches home route defaults')
})

function readInitialState (html: string): InitialState | null {
    const stateMatch = html.match(
        /<script id="__INITIAL_STATE__"[\s\S]*?type="application\/json">(.+?)<\/script>/
    )
    if (!stateMatch) return null
    return JSON.parse(stateMatch[1]) as InitialState
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
            fetch: async () => new Response('Not Found', { status: 404 })
        } as unknown as Fetcher
    }
}
