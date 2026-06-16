# Earthquake Map

Interactive map that displays earthquake data from the [USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/).

## Requirements

- Node.js 18+
- npm

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Bonus: IndexedDB caching

Fetched results are persisted locally in IndexedDB so that repeat or overlapping filters can be served without hitting the network again. 

What is cached: each successful USGS response is stored as a Cache Entry keyed by its Query. Empty results are cached too. Errors are never cached.

Cache invalidation:


| Filter range               | TTL  | Why                                                                                                                               |
| -------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------- |
| Query includes today       | 5 m  | New events still arrive and magnitudes shift heavily in the first hours                                                           |
| Query is fully in the past | 24 h | No new events possible, but USGS assigns final catalog magnitudes "days to weeks" later, so an entry is trusted for at most a day |


The timeframes come from the USGS revision policy ([why/when magnitudes update](https://www.usgs.gov/faqs/whywhen-does-usgs-update-magnitude-earthquake)).

Invalidation is passive, a stale entry is detected and deleted only when its Query is requested again. 

Accepted tradeoff: a magnitude revision on a recently-closed range (e.g. endtime = yesterday) can be served up to 24h stale, since it falls in the historical tier. I considered a "last N days" volatile window to refresh those sooner, but rejected it: revisions are small and visually imperceptible on a map viewer, the benefit only applies to repeated same-day re-queries of the same range, and it adds an arbitrary N that merely relocates the boundary. The "includes today" rule is exact for new events and the staleness it permits doesn't matter for this use case.

If IndexedDB is unavailable (private mode, blocked storage) the app runs network-only. 