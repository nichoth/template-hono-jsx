# template hono jsx

A template for projects using [Hono and Hono JSX](https://hono.dev/docs/guides/jsx).

## Vite

### CSS

* CSS transformation still uses `lightningcss` (via css.transformer),
  only minification uses `esbuild`.

## Test

### Hydration

```sh
npm run test:hydration
```

## Ralph

Start a Ralph loop of 5 iterations:

```sh
./ralph.sh 5
```

See [the blog post](https://ghuntley.com/loop/).
