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
- `src/lib/spatial.ts`: 3D time stream, connection layout, and camera
- `src/lib/evidence.ts`: browser storage for claim attachments
- `src/components/`: the board and its panels

Every game starts with its canon main story. Canon side lore is added after
that backbone; theory branches open once the game's main story is mapped.

Genshin Impact is the default universe. The first researched slice is the
Mondstadt prologue (Acts I–III): 23 sourced claims, with links explicitly
labeled as community quest transcripts. This is not the full Genshin story.
See `docs/GENSHIN_RESEARCH.md` for the sources, limits, and next research target.

Use **Time stream** to follow the main story by story or release order.
**Connection map** opens an orbitable 3D map of the same lore. Select a point
to trace its claims or use **Focus these connections** to narrow the view.
In Trace & sources, open a claim’s evidence panel to add files or links.
See [3D views and evidence](docs/3D_AND_EVIDENCE.md) for controls and limits
and [Change log](docs/CHANGES.md) for project history.

Phones have Board, Main story & explore, and Trace & sources tabs. Progress
and forks save separately per universe in localStorage. Existing Emberfall
saves retain their original `histhoria-v1` key; Genshin uses `histhoria-v1:genshin`.

```bash
npm test              # Node 22.18+ / 24: lore, spoiler, and data checks
npx tsc --noEmit
npx eslint src
npx next build
```
