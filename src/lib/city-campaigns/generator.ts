import { getCityData, getRecommendedBudget, type CityData } from "./research";

export interface GeneratedKeyword {
  text: string;
  matchType: "EXACT" | "PHRASE" | "BROAD";
}

export interface GeneratedAdCopy {
  headlines: string[];
  descriptions: string[];
}

export interface GeneratedCampaignConfig {
  name: string;
  cityName: string;
  state: string;
  businessType: string;
  keywords: GeneratedKeyword[];
  adCopy: GeneratedAdCopy;
  geoTargeting: {
    city: string;
    state: string;
    country: string;
    radiusMiles: number;
  };
  suggestedBudget: {
    min: number;
    recommended: number;
    max: number;
  };
  cityData: CityData;
}

const BUSINESS_KEYWORD_TEMPLATES: Record<string, string[]> = {
  "restaurant": ["restaurant", "dining", "food delivery", "best restaurants", "restaurants near me", "catering", "takeout", "dine in"],
  "plumber": ["plumber", "plumbing services", "emergency plumber", "plumbing repair", "water heater repair", "drain cleaning", "plumber near me", "pipe repair"],
  "dentist": ["dentist", "dental clinic", "teeth cleaning", "dental care", "cosmetic dentist", "dental implants", "emergency dentist", "dentist near me"],
  "lawyer": ["lawyer", "attorney", "legal services", "law firm", "legal advice", "personal injury lawyer", "family lawyer", "lawyer near me"],
  "real_estate": ["real estate agent", "homes for sale", "buy house", "real estate", "realtor", "property listing", "house for sale", "real estate agent near me"],
  "gym": ["gym", "fitness center", "personal trainer", "workout gym", "gym membership", "fitness classes", "gym near me", "health club"],
  "auto_repair": ["auto repair", "car mechanic", "auto service", "brake repair", "oil change", "car repair shop", "mechanic near me", "auto body shop"],
  "salon": ["hair salon", "beauty salon", "haircut", "hair stylist", "beauty services", "nail salon", "spa services", "salon near me"],
  "hvac": ["HVAC", "air conditioning repair", "heating repair", "AC installation", "furnace repair", "HVAC services", "AC repair near me", "heating and cooling"],
  "general": ["services", "business", "professional services", "local business", "best in town", "top rated", "near me", "affordable"],
};

function getKeywordsForBusiness(businessType: string, cityName: string): GeneratedKeyword[] {
  const normalizedType = businessType.toLowerCase().replace(/\s+/g, "_");
  const templates = BUSINESS_KEYWORD_TEMPLATES[normalizedType] || BUSINESS_KEYWORD_TEMPLATES["general"];

  const keywords: GeneratedKeyword[] = [];

  for (const template of templates) {
    // Exact match with city
    keywords.push({
      text: `${template} ${cityName}`,
      matchType: "EXACT",
    });

    // Phrase match
    keywords.push({
      text: `${template} in ${cityName}`,
      matchType: "PHRASE",
    });

    // Broad match for generic terms
    keywords.push({
      text: `best ${template}`,
      matchType: "BROAD",
    });
  }

  return keywords;
}

function generateAdCopy(
  businessType: string,
  cityName: string,
  state: string
): GeneratedAdCopy {
  const biz = businessType.charAt(0).toUpperCase() + businessType.slice(1);
  const location = `${cityName}, ${state}`;

  return {
    headlines: [
      `Top ${biz} in ${cityName}`,
      `${cityName}'s Best ${biz}`,
      `Trusted ${biz} - ${cityName}`,
      `${biz} Services ${cityName}`,
      `#1 ${biz} in ${location}`,
      `Professional ${biz} Near You`,
      `Affordable ${biz} Services`,
      `Call Now - Free Estimate`,
      `Serving ${cityName} Area`,
      `${biz} Experts - ${state}`,
    ],
    descriptions: [
      `Looking for a reliable ${businessType} in ${cityName}? We offer top-rated services with competitive pricing. Contact us today for a free consultation.`,
      `Trusted ${businessType} serving ${location} and surrounding areas. Years of experience, 5-star reviews. Schedule your appointment now.`,
      `Professional ${businessType} services in ${cityName}. Fast, reliable, and affordable. Call today for a free estimate. Satisfaction guaranteed.`,
      `${cityName}'s most trusted ${businessType}. Serving the ${state} area with quality service. Book online or call now for immediate assistance.`,
    ],
  };
}

/**
 * Generate a complete campaign configuration for a city + business type
 */
export function generateCityCampaign(
  cityName: string,
  businessType: string
): GeneratedCampaignConfig | null {
  const cityData = getCityData(cityName);
  if (!cityData) return null;

  const budget = getRecommendedBudget(cityData);
  const keywords = getKeywordsForBusiness(businessType, cityData.name);
  const adCopy = generateAdCopy(businessType, cityData.name, cityData.state);

  const radiusMiles =
    cityData.population > 1000000
      ? 15
      : cityData.population > 500000
        ? 20
        : 25;

  return {
    name: `${businessType.charAt(0).toUpperCase() + businessType.slice(1)} - ${cityData.name}, ${cityData.state}`,
    cityName: cityData.name,
    state: cityData.state,
    businessType,
    keywords,
    adCopy,
    geoTargeting: {
      city: cityData.name,
      state: cityData.state,
      country: "US",
      radiusMiles,
    },
    suggestedBudget: budget,
    cityData,
  };
}
