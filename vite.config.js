// @ts-check
import { defineConfig } from 'vite'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig(({ mode }) => {
    return {
        plugins: [
            cloudflare({
                configPath: './wrangler.jsonc',
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
            logOverride: { 'this-is-undefined-in-esm': 'silent' },
            jsx: 'automatic',
            jsxImportSource: 'hono/jsx',
        },
        publicDir: '_public',
        css: {
            transformer: 'lightningcss',
            lightningcss: {
                targets: browserslistToTargets(browserslist('>= 0.25%')),
            },
        },
        server: {
            port: 2222,
            host: true,
            open: true,
        },
        build: {
            cssMinify: 'esbuild',
            minify: mode === 'production',
            outDir: './dist',
            emptyOutDir: true,
            sourcemap: mode !== 'production' ? 'inline' : false,
        },
    }
})
