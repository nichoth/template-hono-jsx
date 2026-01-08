import { createApp } from 'honox/server'
import { showRoutes } from 'hono/dev'

const app = createApp()

if (import.meta.env.DEV) {
    showRoutes(app)
}

export default app
