import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCityCampaign } from "@/lib/city-campaigns/generator";
import { getCityData } from "@/lib/city-campaigns/research";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cityCampaigns = await prisma.cityCampaign.findMany({
      where: { userId: session.user.id },
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
            platform: true,
            status: true,
            spend: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cityCampaigns);
  } catch (error) {
    console.error("Error fetching city campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch city campaigns" },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  cityName: z.string().min(1),
  businessType: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { cityName, businessType } = parsed.data;

    // Look up city data
    const cityData = getCityData(cityName);
    if (!cityData) {
      return NextResponse.json(
        { error: `City "${cityName}" not found in our database. Try one of the top 50 US cities.` },
        { status: 400 }
      );
    }

    // Generate campaign config
    const generatedConfig = generateCityCampaign(cityName, businessType);

    // Create the city campaign record
    const cityCampaign = await prisma.cityCampaign.create({
      data: {
        userId: session.user.id,
        cityName: cityData.name,
        state: cityData.state,
        country: "US",
        businessType,
        researchData: JSON.parse(JSON.stringify(cityData)),
        generatedConfig: JSON.parse(JSON.stringify(generatedConfig)),
        status: "GENERATED",
      },
    });

    return NextResponse.json(cityCampaign, { status: 201 });
  } catch (error) {
    console.error("Error creating city campaign:", error);
    return NextResponse.json(
      { error: "Failed to create city campaign" },
      { status: 500 }
    );
  }
}
