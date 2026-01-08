import { createRoute } from 'honox/factory'

export const GET = createRoute((c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})
