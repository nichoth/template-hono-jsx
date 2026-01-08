// @ts-check
import { defineConfig } from 'vite'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'
import honox from 'honox/vite'
import adapter from '@hono/vite-dev-server/cloudflare'

export default defineConfig(({ mode }) => {
    // Client build mode - builds islands for browser
    if (mode === 'client') {
        return {
            build: {
                rollupOptions: {
                    input: ['./app/client.ts'],
                    output: {
                        entryFileNames: 'static/client.js',
                    },
                },
                outDir: './dist',
                manifest: true,
                emptyOutDir: false,
            },
            resolve: {
                alias: {
                    '@substrate-system/debug': '@substrate-system/debug/noop'
                }
            },
        }
    }

    // Server build mode (default)
    return {
        plugins: [
            honox({
                devServer: {
                    adapter,
                },
                client: {
                    input: ['/app/client.ts'],
                },
            }),
        ],
        define: {
            global: 'globalThis'
        },
        resolve: {
            alias: {
                '@substrate-system/debug': mode === 'production' ?
                    '@substrate-system/debug/noop' :
                    '@substrate-system/debug'
            }
        },
        esbuild: {
            logOverride: { 'this-is-undefined-in-esm': 'silent' }
        },
        publicDir: '_public',
        css: {
            transformer: 'lightningcss',
            lightningcss: {
                targets: browserslistToTargets(browserslist('>= 0.25%')),
            },
        },
        server: {
            port: 8888,
            host: true,
            open: true,
        },
        build: {
            cssMinify: 'lightningcss',
            target: 'esnext',
            minify: mode === 'production',
            outDir: './dist',
            emptyOutDir: true,
            sourcemap: mode !== 'production' ? 'inline' : false,
        },
    }
})
