export const TERRAIN_CATEGORY_OPTIONS = [
  {
    id: "0",
    title: "Category 0 — Sea/coastal (open sea)",
    img: "https://cdn.eurocodeapplied.com/images/figures/ec1-wind-terrain-category-0.png",
    alt: "Sea or coastal area exposed to open sea.",
    desc: "Sea or coastal area exposed to open sea.",
  },
  {
    id: "I",
    title: "Category I — Water/open flat",
    img: "https://cdn.eurocodeapplied.com/images/figures/ec1-wind-terrain-category-I.png",
    alt: "Lakes or areas with negligible vegetation and without obstacles.",
    desc: "Lakes or areas with negligible vegetation and without obstacles.",
  },
  {
    id: "II",
    title: "Category II — Low vegetation",
    img: "https://cdn.eurocodeapplied.com/images/figures/ec1-wind-terrain-category-II.png",
    alt: "Areas with low vegetation and isolated obstacles (trees, buildings).",
    desc: "Areas with low vegetation and isolated obstacles (trees, buildings).",
  },
  {
    id: "III",
    title: "Category III — Regular cover",
    img: "https://cdn.eurocodeapplied.com/images/figures/ec1-wind-terrain-category-III.png",
    alt: "Areas with a regular cover of vegetation or buildings.",
    desc: "Areas with a regular cover of vegetation or buildings.",
  },
  {
    id: "IV",
    title: "Category IV — Dense urban/high rise",
    img: "https://cdn.eurocodeapplied.com/images/figures/ec1-wind-terrain-category-IV.png",
    alt: "Dense urban area with buildings taller than 15 metres.",
    desc: "≥15% of surface covered by buildings with average height > 15 m.",
  },
];

export const Z0_BY_TERRAIN = {
  "0": 0.003,
  I: 0.01,
  II: 0.05,
  III: 0.3,
  IV: 1,
};

export const DEFAULT_TERRAIN_CATEGORY = "III";

export const getTerrainOption = (id) =>
  TERRAIN_CATEGORY_OPTIONS.find((option) => option.id === id) || null;
