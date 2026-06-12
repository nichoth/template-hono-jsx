import { DurableObject } from 'cloudflare:workers'
import { sessionMiddleware, CookieStore, type Session } from 'hono-sessions'
import { cors } from 'hono/cors'
import { Hono, type Context } from 'hono'
import { renderToString } from 'hono/jsx/dom/server'
import { App } from '../shared/App.js'
import { createInitialState } from '../shared/state.js'

/**
 * A CF durable object.
 * https://developers.cloudflare.com/durable-objects
 */
export class MyDurableObject extends DurableObject<Env> {
    /**
     * Write a new post.
     */
    async post (
        _text:string,
        _buffer:ArrayBuffer,
        _mimeType:string,
        _alt:string
    ) {
        // DID from `handleCallback` step
        const did = await this.ctx.storage.get<string>('user_did')
        if (!did) throw new Error('Unauthorized: No session in DO')

        return {}
    }

    /**
     * Authentication
     */
    async startAuth (handle:string):Promise<string> {
        if (handle[0] === '@') {
            handle = handle.slice(1)
        }

        // TODO
        return 'abc123'
    }

    async handleCallback (_params:Record<string, string>):Promise<{
        did:string
    }> {
        return { did: 'abc123' }
    }

    /**
     * The Durable Object exposes an RPC method sayHello which will be
     * invoked when a Durable Object instance receives a request from a Worker
     * via the same method invocation on the stub
     *
     * @returns The greeting to be sent back to the Worker
     */
    async sayHello ():Promise<string> {
        const res = this.ctx.storage.sql
            .exec("SELECT 'Hello, World!' as greeting")
            .one()

        return res.greeting as string
    }
}

const app = new Hono<{ Bindings:Env; Variables:{ session:Session } }>()
const store = new CookieStore()
let sessionMw:ReturnType<typeof sessionMiddleware>|null = null

app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS']
}))

// Add X-Robots-Tag to all responses to block indexing
app.use('*', async (c, next) => {
    await next()
    c.header('X-Robots-Tag', 'noindex, nofollow')
})

// Block all bots
app.get('/robots.txt', (c) => {
    return c.text('User-agent: *\nDisallow: /\n', 200, {
        'Content-Type': 'text/plain',
    })
})

app.use('*', async (ctx, next) => {
    if (!sessionMw) {
        sessionMw = sessionMiddleware({
            store,
            encryptionKey: ctx.env.SESSION_SECRET,
            expireAfterSeconds: 3600,
            cookieOptions: {
                httpOnly: true,
                secure: ctx.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                path: '/',
            },
        })
    }

    // execute middleware
    return sessionMw(ctx, next)
})

/**
 * Write a new post.
 */
app.post('/api/post', async (c) => {
    const session = c.get('session')
    const activeDoId = session.get('active_do_id')
    if (!activeDoId) return c.json({ error: 'Unauthorized' }, 401)

    // Parse the multipart/form-data
    const body = await c.req.parseBody()

    // Extract fields
    const text = body.text as string
    const altText = body.alt as string
    // Hono automatically turns file parts into File objects
    const file = body.image as File

    if (!file) return c.json({ error: 'No image provided' }, 400)

    try {
        const stub = c.env.MY_DO.getByName(activeDoId)

        // Convert the File to ArrayBuffer to pass to the DO RPC
        const buffer = await file.arrayBuffer()

        const result = await stub.post(
            text,
            buffer,
            file.type,
            altText
        )

        return c.json({ success: true, ...result })
    } catch (err: any) {
        console.error('Proxy Error:', err)
        return c.json({ error: err.message }, 500)
    }
})

// Health check
app.get('/health', (c) => {
    return c.json({ status: 'ok' })
})

/**
 * API routes
 */
app.get('/xrpc/app.bsky.feed.getFeedSkeleton', async ctx => {
    // FIX: Move the limit push to the end and add ORDER BY
    const limit = Math.min(parseInt(ctx.req.query('limit') || '30'), 100)
    const cursor = ctx.req.query('cursor')
    const params:string[] = []

    let query = 'SELECT uri, created_at FROM posts '

    if (cursor) {
        query += 'WHERE created_at < ? '
        params.push(cursor)  // This must be the first parameter
    }

    query += 'ORDER BY created_at DESC LIMIT ?'  // Added ORDER BY
    params.push('' + limit)  // This must be the last parameter

    const { results } = await ctx.env.DB.prepare(query).bind(...params).all()

    // skeleton format
    const feedItems = results.map((row:any) => ({
        post: row.uri,
    }))

    // create a new cursor
    const nextCursor = results.length === limit ?
        (results[results.length - 1].created_at as string) :
        undefined

    return ctx.json({
        cursor: nextCursor,
        feed: feedItems
    })
})

app.get('/.well-known/did.json', async (ctx:Context) => {
    // return the DID document
    return ctx.json({})
})

// CSS dependencies shared across all routes (dev only)
const sharedCss = [
    '/src/client/components/nav.css',
]

// Per-route CSS (dev only -- in production, Vite bundles all CSS)
const routeCss:Record<string, string[]> = {
    '/': ['/src/client/routes/home.css'],
    '/contact': ['/src/client/routes/contact.css'],
}

function cssLinks (pathname:string):string {
    const files = [
        ...sharedCss,
        ...(routeCss[pathname] || []),
    ]
    return files
        .map(f => `    <link rel="stylesheet" href="${f}">`)
        .join('\n')
}

/**
 * In production, fetch the Vite-built index.html from ASSETS
 * and cache it so we only read it once.
 */
let cachedShell:string | null = null

async function getHtmlShell (
    ctx:Context
):Promise<string> {
    if (cachedShell) return cachedShell

    const res = await ctx.env.ASSETS.fetch(
        new Request(new URL('/', ctx.req.url))
    )
    const text = await res.text()
    cachedShell = text
    return text
}

// Catch-all: serve static assets or SSR for page routes
app.all('*', async (ctx) => {
    const url = new URL(ctx.req.url)
    const pathname = url.pathname

    // In dev mode, delegate Vite-internal and source paths
    // to the ASSETS binding (backed by Vite's dev server).
    if (import.meta.env.DEV) {
        if (pathname.startsWith('/@') ||
            pathname.startsWith('/node_modules/') ||
            pathname.startsWith('/src/')) {
            return ctx.env.ASSETS.fetch(ctx.req.raw)
        }
    }

    // Try to serve static assets first (files with extensions)
    if (pathname.includes('.')) {
        try {
            const response = await ctx.env.ASSETS.fetch(
                ctx.req.raw
            )
            if (response.status !== 404) {
                return response
            }
        } catch {
            // Asset not found, fall through
        }
    }

    // SSR: Render the app for page routes
    const route = pathname + url.search
    const initialState = createInitialState(route, 0)
    const appHtml = renderToString(<App state={initialState} />)
    const stateJson = JSON.stringify(initialState)

    let html:string

    if (import.meta.env.DEV) {
        // Dev: use source paths (Vite transforms on the fly)
        html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1">
    <title>App</title>
    <link rel="stylesheet" href="/src/client/style.css">
${cssLinks(pathname)}
</head>
<body>
    <div id="root">${appHtml}</div>
    <script id="__INITIAL_STATE__" type="application/json">
        ${stateJson}
    </script>
    <script type="module" src="/src/client/index.tsx"></script>
</body>
</html>`
    } else {
        // Production: use Vite-built index.html with hashed
        // asset paths, inject SSR content + state
        const shell = await getHtmlShell(ctx)
        html = shell
            .replace(
                '<div id="root"></div>',
                `<div id="root">${appHtml}</div>`
            )
            .replace(
                '</body>',
                `    <script id="__INITIAL_STATE__"
        type="application/json">${stateJson}</script>
</body>`
            )
    }

    return ctx.html(html)
})

export default app
