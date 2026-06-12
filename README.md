# template hono jsx

A template for projects using
[Hono as server](https://hono.dev/), and Hono JSX for
[creating HTML](https://hono.dev/docs/guides/jsx).

This uses `hono/jsx` to hydrate the client-side app, and `hono/jsx/dom/server`
to serialize the app to an HTML string on the server.

The initial request response includes a serialized state object, 
`#__INITIAL_STATE__`. The client uses this to
[hydrate](https://jsr.io/@hono/hono/doc/jsx/dom/client/~/hydrateRoot)
its in-memory state.

After the initial page load, every subsequent request should only
be calls that you explicitly make, meaning this is a server-side rendered
[single-page application](https://developer.mozilla.org/en-US/docs/Glossary/SPA).

---

Use the `template` button in Github's GUI.


<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [Vite](#vite)
  * [CSS](#css)
- [Test](#test)
  * [Hydration](#hydration)
- [speckit](#speckit)
- [Ralph](#ralph)

<!-- tocstop -->

</details>


## Vite

### CSS

* CSS transformation uses `lightningcss` (via css.transformer),
  only minification uses `esbuild`.


## Test

### Hydration

```sh
npm run test:hydration
```
