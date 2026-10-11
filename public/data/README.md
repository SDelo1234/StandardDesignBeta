# Data Assets

Files here are deployed with the Vite build.

- `vbpostcode.csv` – fundamental basic wind velocity vb,map (m/s) by postcode district (UK NA Figure NA.1).
- `alt/<DISTRICT>.json` – altitude (m AOD) by inward code, generated from `data/Postcode_elevation.csv` by `scripts/build-altitude-shards.mjs`. Not committed.

Wind values are matched on the postcode district, falling back to the longest available prefix (flagged in the UI). Altitude uses the exact postcode, or the highest altitude in the same postcode sector (flagged).
