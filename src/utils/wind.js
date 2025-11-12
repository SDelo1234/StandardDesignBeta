export const C_PROB_BY_TR = {
  2: 0.82,
  5: 0.88,
  10: 0.93,
  50: 1.0,
};

export const C_SEASON = {
  1: { m1: 0.98, m2: 0.98, m4: 0.98 },
  2: { m1: 0.83, m2: 0.86, m4: 0.87 },
  3: { m1: 0.82, m2: 0.83, m4: 0.83 },
  4: { m1: 0.75, m2: 0.75, m4: 0.76 },
  5: { m1: 0.69, m2: 0.71, m4: 0.73 },
  6: { m1: 0.66, m2: 0.67, m4: 0.83 },
  7: { m1: 0.62, m2: 0.71, m4: 0.86 },
  8: { m1: 0.71, m2: 0.82, m4: 0.90 },
  9: { m1: 0.82, m2: 0.85, m4: 0.96 },
  10: { m1: 0.82, m2: 0.89, m4: 1.0 },
  11: { m1: 0.88, m2: 0.95, m4: 1.0 },
  12: { m1: 0.94, m2: 1.0, m4: 1.0 },
};

export const mapDurationToReturnPeriod = (durationCategory) => {
  switch (durationCategory) {
    case "UNDER_3_DAYS":
      return 2;
    case "UNDER_1_MONTH":
    case "UNDER_2_MONTHS":
    case "UNDER_4_MONTHS":
      return 5;
    case "UNDER_A_YEAR":
      return 10;
    case "OVER_A_YEAR":
      return 50;
    default:
      throw new Error(`Unsupported duration category: ${durationCategory}`);
  }
};

export const durationToSeasonKey = (durationCategory) => {
  if (durationCategory === "UNDER_1_MONTH") return "m1";
  if (durationCategory === "UNDER_2_MONTHS") return "m2";
  if (durationCategory === "UNDER_4_MONTHS") return "m4";
  return null;
};

export const deriveWindFactors = ({ installationMonth, durationCategory }) => {
  if (!installationMonth || !durationCategory) {
    throw new Error("Installation month and duration category are required");
  }

  const returnPeriodYears = mapDurationToReturnPeriod(durationCategory);
  const cProb = C_PROB_BY_TR[returnPeriodYears];

  const seasonKey = durationToSeasonKey(durationCategory);
  const seasonRow = C_SEASON[installationMonth];
  const cSeason =
    seasonKey && seasonRow ? seasonRow[seasonKey] : 1.0;

  return {
    returnPeriodYears,
    cProb,
    cSeason,
  };
};
