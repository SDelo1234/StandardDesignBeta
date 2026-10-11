/** UK NA terrain classes (NA.2.11): the UK uses country and town only. */
export const TERRAIN_OPTIONS = [
  {
    id: "country",
    title: "Country",
    desc: "Open country, farmland, villages and sites less than 1 km inside a town.",
  },
  {
    id: "town",
    title: "Town",
    desc: "Built-up area extending at least 1 km upwind of the site.",
  },
];

export const DEFAULT_TERRAIN = "country";

export const getTerrainOption = (id) => TERRAIN_OPTIONS.find((option) => option.id === id) || null;
