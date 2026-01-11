import { DurableObject } from 'cloudflare:workers'
import { sessionMiddleware, CookieStore, type Session } from 'hono-sessions'
import { cors } from 'hono/cors'
import { Hono, type Context } from 'hono'

/**
 * A CF durable object.
 * https://developers.cloudflare.com/durable-objects
 *
 *   - handle oauth with Bluesky
 *   - 1 DO per user
 */
export class MyDurableObject extends DurableObject<Env> {
    /**
     * Write a new post.
     */
    async post (
        _text: string,
        _buffer: ArrayBuffer,
        _mimeType: string,
        _alt: string
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

    async handleCallback (_params:Record<string, string>):Promise<{ did:string }> {
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
 * Check authentication status.
 * Returns whether the user has a valid session.
 */
app.get('/api/auth/status', async (ctx) => {
    const session = ctx.get('session')
    const activeDoId = session.get('active_do_id') as string | undefined

    if (!activeDoId) {
        return ctx.json({
            authenticated: false,
            registered: false
        })
    }

    try {
        const stub = ctx.env.MY_DO.getByName(activeDoId)
        return ctx.newResponse(await stub.sayHello(), 200)
    } catch (_err) {
        const err = _err as Error
        return ctx.newResponse(err.toString(), 500)
    }
})

/**
 * Start OAuth login flow.
 * Creates a unique DO for this user session and initiates Bluesky OAuth.
 */
app.post('/api/auth/login', async (ctx) => {
    try {
        const body = await ctx.req.json<{ handle:string }>()
        let handle = body.handle?.trim()

        if (!handle) {
            return ctx.json({ error: 'Handle is required' }, 400)
        }

        // Normalize handle (remove @ prefix if present)
        if (handle.startsWith('@')) {
            handle = handle.slice(1)
        }

        // Generate a unique session ID for this auth attempt
        // We use the handle as the DO name so users get the same DO on re-auth
        const sessionId = handle.toLowerCase()

        // Get or create a Durable Object for this user
        const stub = ctx.env.MY_DO.getByName(sessionId)

        // Start the OAuth flow - this returns the authorization URL
        const authUrl = await stub.startAuth(handle)

        // Store the pending session ID in cookie session
        const session = ctx.get('session')
        session.set('pending_do_id', sessionId)

        return ctx.json({ success: true, authUrl })
    } catch (_err) {
        const err = _err as Error
        console.error('OAuth login start failed:', err)
        return ctx.newResponse('Failed to start authentication', 500)
    }
})

/**
 * OAuth callback handler.
 * Processes the OAuth callback from Bluesky and establishes the session.
 */
app.get('/api/auth/callback', async (ctx) => {
    const session = ctx.get('session')
    const pendingDoId = session.get('pending_do_id') as string | undefined

    if (!pendingDoId) {
        // Redirect to login with error
        return ctx.redirect('/login?error=no_pending_session')
    }

    try {
        // Get the OAuth callback parameters
        const params:Record<string, string> = {}
        const url = new URL(ctx.req.url)
        url.searchParams.forEach((value, key) => {
            params[key] = value
        })

        // Check for OAuth error in callback
        if (params.error) {
            console.error('OAuth error:', params.error, params.error_description)
            session.forget('pending_do_id')
            return ctx.redirect(`/login?error=${encodeURIComponent(params.error)}`)
        }

        // Get the DO and complete the OAuth flow
        const stub = ctx.env.MY_DO.getByName(pendingDoId)
        const result = await stub.handleCallback(params)

        // Clear pending and set active session
        session.forget('pending_do_id')
        session.set('active_do_id', pendingDoId)
        session.set('user_did', result.did)

        // Redirect to home page
        return ctx.redirect('/?auth=success')
    } catch (err: any) {
        console.error('OAuth callback failed:', err)
        session.forget('pending_do_id')
        return ctx.redirect(`/login?error=${encodeURIComponent(err.message || 'callback_failed')}`)
    }
})

/**
 * Logout endpoint.
 * Clears the session and optionally revokes OAuth tokens.
 */
app.post('/api/auth/logout', async (ctx) => {
    const session = ctx.get('session')
    const activeDoId = session.get('active_do_id') as string | undefined

    if (activeDoId) {
        try {
            // Optionally revoke the OAuth session in the DO
            // const stub = ctx.env.DRERINGS_DO.getByName(activeDoId)
            // await stub.revokeSession()
        } catch (err) {
            console.error('Failed to revoke session:', err)
        }
    }

    // Clear all session data by marking for deletion
    session.deleteSession()

    return ctx.json({ success: true })
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

// OAuth client metadata (required by AT Protocol OAuth)
// Note: In production, the static file in _public/oauth/ takes precedence
app.get('/oauth/client-metadata.json', (c) => {
    const isDev = c.env.NODE_ENV === 'development'
    return c.json({ isDev })
})

app.get('/api/feed/following', async (c) => {
    const userDid = c.req.query('did')

    // 'created_at' timestamp from the last post seen
    const cursor = c.req.query('cursor')

    if (!userDid) return c.json({ error: 'Missing DID' }, 400)

    // Build the query dynamically based on whether we are loading the
    // first page or "more"
    let query = `
        SELECT p.*, prof.handle, prof.display_name
        FROM posts p
        JOIN follows f ON p.author_did = f.subject_did
        LEFT JOIN profiles prof ON p.author_did = prof.did
        WHERE f.creator_did = ?
    `

    const params:string[] = [userDid]

    if (cursor) {
        query += ' AND p.created_at < ?'
        params.push(cursor)
    }

    query += ' ORDER BY p.created_at DESC LIMIT 20'

    try {
        const { results } = await c.env.DB.prepare(query).bind(...params).all()

        return c.json({
            feed: results,
            // Provide the cursor for the next request
            nextCursor: results.length > 0 ?
                results[results.length - 1].created_at :
                null
        })
    } catch (err) {
        console.error(err)
        return c.json({ error: 'Database error' }, 500)
    }
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

// Catch-all: serve static assets or index.html for SPA routes
app.all('*', async (ctx) => {
    const url = new URL(ctx.req.url)

    // Try to serve the exact asset first
    try {
        const response = await ctx.env.ASSETS.fetch(ctx.req.raw)
        if (response.status !== 404) {
            return response
        }
    } catch {
        // Asset not found, fall through to SPA
    }

    // For SPA routes, serve index.html
    const indexUrl = new URL('/index.html', url.origin)
    return ctx.env.ASSETS.fetch(new Request(indexUrl))
})

export default app
