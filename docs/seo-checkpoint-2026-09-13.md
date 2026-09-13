# SEO checkpoint — 13 September 2026

This checkpoint supersedes earlier statements that Search Console has not been connected or the sitemap has not been submitted. It distinguishes Google's recorded indexing state from the site's available pages and from search traffic.

## Confirmed connection and sitemap

- Domain property: `sc-domain:soutenancepro.com`, verified by the owner through DNS on 12 September 2026.
- GSC Wizard connection confirmed on 13 September with `siteOwner` permission. The property is registered and visible in its dashboard.
- Registered sitemap: `https://soutenancepro.com/sitemap.xml`.
- Search Console API reports submission at `2026-09-12T20:28:31.252Z` and successful reading at `2026-09-12T20:28:34.370Z`.
- 88 submitted web URLs; no errors or warnings; not pending.
- The sitemap API's `indexed` field returned zero even though individual URL Inspection results confirm indexed pages below. Do not use this field as the site's current indexed-page total.
- Branded query terms recorded in GSC Wizard: `soutenance pro`, `soutenancepro`, `soutenancepro.com`.
- The 12 September launch is annotated in the property's history. No ranking target is recorded as a result.

## Google URL Inspection sample

Ten priority URLs were inspected through the Google URL Inspection API on 13 September. These are recorded index results, not live HTTP tests and not a complete census of all 88 URLs. Inspection does not itself request indexing.

| Path | Recorded coverage | Last crawl, UTC |
| --- | --- | --- |
| `/` | Submitted and indexed | 2026-09-12 20:40:55 |
| `/bibliotheque` | Discovered, currently not indexed | None reported |
| `/pfe` | URL unknown to Google | None reported |
| `/pfe-ispits` | URL unknown to Google | None reported |
| `/memoire` | Discovered, currently not indexed | None reported |
| `/guides/problematique-pfe-infirmier` | Discovered, currently not indexed | None reported |
| `/guides/questionnaire-recherche-sante` | URL unknown to Google | None reported |
| `/guides/analyse-spss-pfe-sante` | URL unknown to Google | None reported |
| `/guides/presentation-soutenance-pfe` | Submitted and indexed | 2026-09-13 00:35:00 |
| `/guides/plan-rapport-de-stage` | Discovered, currently not indexed | None reported |

Two of the ten sampled pages are confirmed indexed. This does not mean that only two pages on the whole site are indexed. The owner also supplied a successful live homepage inspection on 12 September: crawl allowed, fetch successful, indexing allowed, and the expected homepage canonical. Its earlier July robots warning therefore does not describe that later live test.

## Performance baseline and limits

The initial 7-day API summary covers **4–10 September 2026**, before the sitemap launch. It returned no daily rows and zero clicks/impressions. Data-maturity metadata identifies 11 September as settled and 12 September as the first incomplete date. This is not a measurement of post-launch traffic. Average position and CTR are not meaningful without impressions; do not report the returned zero position as a ranking.

Once post-launch dates are settled, use identical date windows for page/query and country comparisons (France, Morocco, Algeria, Tunisia). Prioritize observed questions and pages with impressions before choosing further content expansions. No traffic, conversion uplift, or Top 1/Top 3 result has been demonstrated.

## Bounded editorial improvement

The first follow-up improves five existing guides: nursing PFE problem statements, health questionnaires, interpretation of SPSS output, oral presentations, and internship-report plans. Their hero and final calls to action now select the matching supported project module through the existing `?outil=` flow. Their article text links relevant existing guides, service descriptions, and freely available Word templates. Their URLs, accessible reading path, methodological limits, and original sources are preserved. The SPSS module is described as helping interpret supplied output, not as executing SPSS.

No new SEO pages, copied research records, invented references, or ranking claims are needed for this change. The intended indexing perimeter remains 88 canonical pages. Evaluation will follow observed search and user behavior rather than a count of added pages.

Validation: both existing SEO tests passed, including complete preview and production builds, public internal links, canonicals, sitemap membership, structured data and template files. A separate rendered-HTML check confirmed both module actions, the intended student pathway, the related service link and free reading action on each of the five guides. The other 40 guides and pathways render identically to their previous versions.

## Remaining visibility limits

- No direct live-site crawl or private Vercel log access was available during this session; public deployment status and the owner's Google live-test screenshots are separate evidence.
- GSC Wizard inspections are saved in its history. No recurring inspection tracker, email digest, outreach, paid campaign, or new paid subscription was enabled.
- The connected property currently has no linked GA4 property, so Search Console data alone cannot establish account signups, purchases, or conversion rates.

References: [Google URL Inspection](https://support.google.com/webmasters/answer/9012289), [Sitemap report](https://support.google.com/webmasters/answer/7451001), [Requesting a crawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
