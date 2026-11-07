# Histhoria

Lore you can trace, and theories you can fork. See `DESIGN.md` for the thinking.

```bash
npm install
npm run dev      # http://localhost:3200
```

Next 16 · React 19 · TypeScript · Tailwind 4 · zustand · @xyflow/react

- `src/lib/types.ts`: the data model (entity, claim, source, theory)
- `src/lib/data/emberfall.ts`: the invented demo world
- `src/lib/lore.ts`: trace, spoiler shield, verdicts and hit rate
- `src/lib/layout.ts`: timeline and web layouts
- `src/components/`: the board and its panels

Your forks and spoiler progress are saved in the browser (localStorage).
