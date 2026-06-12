# template hono jsx

A template for projects using [Hono and Hono JSX](https://hono.dev/docs/guides/jsx).

This 

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

* CSS transformation still uses `lightningcss` (via css.transformer),
  only minification uses `esbuild`.

## Test

### Hydration

```sh
npm run test:hydration
```


--------------------------------------------------------------------


## [Ralph](https://ghuntley.com/ralph/)

Need to do these things:

1. Define requirements -- see [`./specs/prd.json`](./specs/prd.json).
2. Create a `PROMPT.md` file &mdash; can copy + paste [PROMPT.md](./PROMPT.md).
   The `PROMPT.md` file defines a stopping condition that will be printed on
   success. The stop text is watched for the the [./ralph.sh script](./ralph.sh).

Start a Ralph loop of 5 iterations:

```sh
./ralph.sh 5
```

or

```sh
while :; do cat prompt.md | claude -p --dangerously-skip-permissions; done
```

* See [the blog post](https://ghuntley.com/loop/).
* [example repo](https://github.com/repomirrorhq/repomirror/blob/main/repomirror.md)
* See [the video where he talks about "the conversation"](https://youtu.be/4Nna09dG_c0?t=530),
  which is how you create the spec.
* [the part in the video where he demos the conversation](https://youtu.be/4Nna09dG_c0?t=721)
* ["so how do you build specs? It's really simple](https://youtu.be/4Nna09dG_c0?t=827)
  > Lets have a discussion, and you can interview me.
* ["It's a dance. This is how you build your specifications"](https://youtu.be/4Nna09dG_c0?t=1117)

### do one thing per loop

It's about keeping the context window small.

### Ralph's tools

Record the tasks in [spec/prd.md](./specs/prd.json).
