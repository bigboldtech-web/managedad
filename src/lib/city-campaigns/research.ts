export interface CityData {
  name: string;
  state: string;
  population: number;
  medianIncome: number;
  competitionLevel: "LOW" | "MEDIUM" | "HIGH";
  topIndustries: string[];
  avgCpcRange: [number, number];
}

const US_CITIES: CityData[] = [
  { name: "New York", state: "NY", population: 8336817, medianIncome: 67046, competitionLevel: "HIGH", topIndustries: ["Finance", "Tech", "Media", "Healthcare"], avgCpcRange: [2.5, 8.0] },
  { name: "Los Angeles", state: "CA", population: 3979576, medianIncome: 65290, competitionLevel: "HIGH", topIndustries: ["Entertainment", "Tech", "Real Estate", "Healthcare"], avgCpcRange: [2.0, 7.0] },
  { name: "Chicago", state: "IL", population: 2693976, medianIncome: 62097, competitionLevel: "HIGH", topIndustries: ["Finance", "Manufacturing", "Tech", "Food"], avgCpcRange: [1.8, 6.0] },
  { name: "Houston", state: "TX", population: 2304580, medianIncome: 53600, competitionLevel: "MEDIUM", topIndustries: ["Energy", "Healthcare", "Manufacturing", "Tech"], avgCpcRange: [1.5, 5.0] },
  { name: "Phoenix", state: "AZ", population: 1608139, medianIncome: 57459, competitionLevel: "MEDIUM", topIndustries: ["Tech", "Real Estate", "Healthcare", "Retail"], avgCpcRange: [1.3, 4.5] },
  { name: "Philadelphia", state: "PA", population: 1603797, medianIncome: 49127, competitionLevel: "HIGH", topIndustries: ["Healthcare", "Education", "Finance", "Tech"], avgCpcRange: [1.8, 5.5] },
  { name: "San Antonio", state: "TX", population: 1547253, medianIncome: 52455, competitionLevel: "LOW", topIndustries: ["Military", "Healthcare", "Tourism", "Manufacturing"], avgCpcRange: [1.0, 3.5] },
  { name: "San Diego", state: "CA", population: 1423851, medianIncome: 79646, competitionLevel: "MEDIUM", topIndustries: ["Biotech", "Defense", "Tourism", "Tech"], avgCpcRange: [1.5, 5.0] },
  { name: "Dallas", state: "TX", population: 1343573, medianIncome: 54747, competitionLevel: "HIGH", topIndustries: ["Tech", "Finance", "Healthcare", "Energy"], avgCpcRange: [1.8, 6.0] },
  { name: "San Jose", state: "CA", population: 1013240, medianIncome: 117324, competitionLevel: "HIGH", topIndustries: ["Tech", "Manufacturing", "Finance", "Healthcare"], avgCpcRange: [3.0, 10.0] },
  { name: "Austin", state: "TX", population: 978908, medianIncome: 75752, competitionLevel: "HIGH", topIndustries: ["Tech", "Education", "Government", "Entertainment"], avgCpcRange: [2.0, 7.0] },
  { name: "Jacksonville", state: "FL", population: 949611, medianIncome: 54701, competitionLevel: "LOW", topIndustries: ["Finance", "Healthcare", "Logistics", "Military"], avgCpcRange: [1.0, 3.5] },
  { name: "Fort Worth", state: "TX", population: 918915, medianIncome: 61405, competitionLevel: "MEDIUM", topIndustries: ["Defense", "Manufacturing", "Healthcare", "Logistics"], avgCpcRange: [1.2, 4.0] },
  { name: "Columbus", state: "OH", population: 905748, medianIncome: 53745, competitionLevel: "MEDIUM", topIndustries: ["Insurance", "Tech", "Education", "Healthcare"], avgCpcRange: [1.2, 4.0] },
  { name: "Indianapolis", state: "IN", population: 887642, medianIncome: 49550, competitionLevel: "LOW", topIndustries: ["Manufacturing", "Healthcare", "Motorsports", "Logistics"], avgCpcRange: [1.0, 3.5] },
  { name: "Charlotte", state: "NC", population: 874579, medianIncome: 62817, competitionLevel: "MEDIUM", topIndustries: ["Finance", "Tech", "Energy", "Healthcare"], avgCpcRange: [1.3, 4.5] },
  { name: "San Francisco", state: "CA", population: 873965, medianIncome: 119136, competitionLevel: "HIGH", topIndustries: ["Tech", "Finance", "Biotech", "Tourism"], avgCpcRange: [3.5, 12.0] },
  { name: "Seattle", state: "WA", population: 737015, medianIncome: 102486, competitionLevel: "HIGH", topIndustries: ["Tech", "Retail", "Aerospace", "Healthcare"], avgCpcRange: [2.5, 8.0] },
  { name: "Denver", state: "CO", population: 715522, medianIncome: 72661, competitionLevel: "MEDIUM", topIndustries: ["Tech", "Energy", "Aerospace", "Tourism"], avgCpcRange: [1.5, 5.0] },
  { name: "Washington", state: "DC", population: 689545, medianIncome: 90842, competitionLevel: "HIGH", topIndustries: ["Government", "Tech", "Defense", "Consulting"], avgCpcRange: [2.5, 8.0] },
  { name: "Nashville", state: "TN", population: 689447, medianIncome: 59828, competitionLevel: "MEDIUM", topIndustries: ["Healthcare", "Music", "Tourism", "Tech"], avgCpcRange: [1.3, 4.5] },
  { name: "Oklahoma City", state: "OK", population: 681054, medianIncome: 55557, competitionLevel: "LOW", topIndustries: ["Energy", "Agriculture", "Military", "Healthcare"], avgCpcRange: [0.8, 3.0] },
  { name: "El Paso", state: "TX", population: 678815, medianIncome: 46871, competitionLevel: "LOW", topIndustries: ["Military", "Manufacturing", "Healthcare", "Trade"], avgCpcRange: [0.7, 2.5] },
  { name: "Boston", state: "MA", population: 675647, medianIncome: 76298, competitionLevel: "HIGH", topIndustries: ["Education", "Biotech", "Finance", "Tech"], avgCpcRange: [2.5, 8.0] },
  { name: "Portland", state: "OR", population: 652503, medianIncome: 73097, competitionLevel: "MEDIUM", topIndustries: ["Tech", "Manufacturing", "Outdoor", "Food"], avgCpcRange: [1.5, 5.0] },
  { name: "Las Vegas", state: "NV", population: 641903, medianIncome: 56354, competitionLevel: "MEDIUM", topIndustries: ["Tourism", "Entertainment", "Real Estate", "Retail"], avgCpcRange: [1.5, 5.5] },
  { name: "Memphis", state: "TN", population: 633104, medianIncome: 41228, competitionLevel: "LOW", topIndustries: ["Logistics", "Healthcare", "Manufacturing", "Music"], avgCpcRange: [0.8, 3.0] },
  { name: "Louisville", state: "KY", population: 633045, medianIncome: 52237, competitionLevel: "LOW", topIndustries: ["Healthcare", "Manufacturing", "Logistics", "Food"], avgCpcRange: [0.8, 3.0] },
  { name: "Baltimore", state: "MD", population: 585708, medianIncome: 52164, competitionLevel: "MEDIUM", topIndustries: ["Healthcare", "Education", "Tech", "Defense"], avgCpcRange: [1.3, 4.5] },
  { name: "Milwaukee", state: "WI", population: 577222, medianIncome: 43125, competitionLevel: "LOW", topIndustries: ["Manufacturing", "Healthcare", "Finance", "Food"], avgCpcRange: [0.9, 3.0] },
  { name: "Albuquerque", state: "NM", population: 564559, medianIncome: 52911, competitionLevel: "LOW", topIndustries: ["Government", "Tech", "Healthcare", "Energy"], avgCpcRange: [0.7, 2.5] },
  { name: "Tucson", state: "AZ", population: 542629, medianIncome: 44610, competitionLevel: "LOW", topIndustries: ["Education", "Military", "Healthcare", "Mining"], avgCpcRange: [0.8, 2.5] },
  { name: "Fresno", state: "CA", population: 542107, medianIncome: 49017, competitionLevel: "LOW", topIndustries: ["Agriculture", "Healthcare", "Manufacturing", "Retail"], avgCpcRange: [0.8, 3.0] },
  { name: "Mesa", state: "AZ", population: 504258, medianIncome: 56992, competitionLevel: "LOW", topIndustries: ["Aerospace", "Tech", "Healthcare", "Education"], avgCpcRange: [0.9, 3.0] },
  { name: "Sacramento", state: "CA", population: 503482, medianIncome: 62335, competitionLevel: "MEDIUM", topIndustries: ["Government", "Healthcare", "Tech", "Agriculture"], avgCpcRange: [1.2, 4.0] },
  { name: "Atlanta", state: "GA", population: 498715, medianIncome: 59948, competitionLevel: "HIGH", topIndustries: ["Tech", "Finance", "Logistics", "Media"], avgCpcRange: [2.0, 6.5] },
  { name: "Kansas City", state: "MO", population: 495327, medianIncome: 55198, competitionLevel: "LOW", topIndustries: ["Healthcare", "Agriculture", "Tech", "Manufacturing"], avgCpcRange: [1.0, 3.5] },
  { name: "Colorado Springs", state: "CO", population: 478961, medianIncome: 63834, competitionLevel: "LOW", topIndustries: ["Military", "Tech", "Tourism", "Healthcare"], avgCpcRange: [1.0, 3.5] },
  { name: "Omaha", state: "NE", population: 478192, medianIncome: 58290, competitionLevel: "LOW", topIndustries: ["Finance", "Agriculture", "Tech", "Insurance"], avgCpcRange: [0.9, 3.0] },
  { name: "Raleigh", state: "NC", population: 467665, medianIncome: 67266, competitionLevel: "MEDIUM", topIndustries: ["Tech", "Biotech", "Education", "Finance"], avgCpcRange: [1.3, 4.5] },
  { name: "Long Beach", state: "CA", population: 466742, medianIncome: 60567, competitionLevel: "MEDIUM", topIndustries: ["Logistics", "Healthcare", "Aerospace", "Tourism"], avgCpcRange: [1.3, 4.5] },
  { name: "Virginia Beach", state: "VA", population: 459470, medianIncome: 73987, competitionLevel: "LOW", topIndustries: ["Military", "Tourism", "Healthcare", "Tech"], avgCpcRange: [1.0, 3.5] },
  { name: "Miami", state: "FL", population: 442241, medianIncome: 44268, competitionLevel: "HIGH", topIndustries: ["Finance", "Tourism", "Real Estate", "Trade"], avgCpcRange: [2.0, 7.0] },
  { name: "Oakland", state: "CA", population: 433031, medianIncome: 80143, competitionLevel: "MEDIUM", topIndustries: ["Tech", "Healthcare", "Logistics", "Finance"], avgCpcRange: [1.5, 5.0] },
  { name: "Minneapolis", state: "MN", population: 429954, medianIncome: 62583, competitionLevel: "MEDIUM", topIndustries: ["Healthcare", "Finance", "Retail", "Tech"], avgCpcRange: [1.3, 4.5] },
  { name: "Tampa", state: "FL", population: 399700, medianIncome: 54599, competitionLevel: "MEDIUM", topIndustries: ["Finance", "Healthcare", "Tourism", "Tech"], avgCpcRange: [1.3, 4.5] },
  { name: "Tulsa", state: "OK", population: 413066, medianIncome: 47650, competitionLevel: "LOW", topIndustries: ["Energy", "Aerospace", "Healthcare", "Finance"], avgCpcRange: [0.8, 3.0] },
  { name: "Arlington", state: "TX", population: 394266, medianIncome: 59022, competitionLevel: "MEDIUM", topIndustries: ["Entertainment", "Defense", "Healthcare", "Manufacturing"], avgCpcRange: [1.2, 4.0] },
  { name: "New Orleans", state: "LA", population: 383997, medianIncome: 43258, competitionLevel: "MEDIUM", topIndustries: ["Tourism", "Energy", "Healthcare", "Shipping"], avgCpcRange: [1.0, 3.5] },
  { name: "Wichita", state: "KS", population: 397532, medianIncome: 50869, competitionLevel: "LOW", topIndustries: ["Aerospace", "Manufacturing", "Healthcare", "Agriculture"], avgCpcRange: [0.7, 2.5] },
];

/**
 * Get city data by name (case-insensitive partial match)
 */
export function getCityData(cityName: string): CityData | null {
  const normalized = cityName.toLowerCase().trim();
  return (
    US_CITIES.find(
      (city) =>
        city.name.toLowerCase() === normalized ||
        `${city.name}, ${city.state}`.toLowerCase() === normalized
    ) || null
  );
}

/**
 * Search cities by partial name match
 */
export function searchCities(query: string): CityData[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  return US_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(normalized) ||
      city.state.toLowerCase().includes(normalized)
  );
}

/**
 * Get all cities
 */
export function getAllCities(): CityData[] {
  return [...US_CITIES];
}

/**
 * Get recommended budget based on city competition and income
 */
export function getRecommendedBudget(city: CityData): {
  min: number;
  recommended: number;
  max: number;
} {
  const baseMultiplier =
    city.competitionLevel === "HIGH"
      ? 3
      : city.competitionLevel === "MEDIUM"
        ? 2
        : 1;

  const incomeMultiplier = city.medianIncome / 60000;

  const recommended = Math.round(
    25 * baseMultiplier * incomeMultiplier
  );

  return {
    min: Math.round(recommended * 0.5),
    recommended,
    max: Math.round(recommended * 2),
  };
}
