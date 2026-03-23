"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

type Platform = "GOOGLE_ADS" | "META_ADS";

interface CampaignFormData {
  platform: Platform | null;
  name: string;
  objective: string;
  dailyBudget: string;
  locations: string[];
  audiences: string[];
}

const GOOGLE_OBJECTIVES = [
  { value: "SEARCH", label: "Search" },
  { value: "DISPLAY", label: "Display" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "VIDEO", label: "Video" },
  { value: "PERFORMANCE_MAX", label: "Performance Max" },
];

const META_OBJECTIVES = [
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Sales" },
  { value: "OUTCOME_APP_PROMOTION", label: "App Promotion" },
];

const STEPS = [
  "Select Platform",
  "Campaign Details",
  "Targeting",
  "Review & Launch",
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [form, setForm] = useState<CampaignFormData>({
    platform: null,
    name: "",
    objective: "",
    dailyBudget: "",
    locations: [],
    audiences: [],
  });

  const objectives =
    form.platform === "GOOGLE_ADS" ? GOOGLE_OBJECTIVES : META_OBJECTIVES;

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.platform !== null;
      case 1:
        return (
          form.name.trim() !== "" &&
          form.objective !== "" &&
          form.dailyBudget !== "" &&
          Number(form.dailyBudget) > 0
        );
      case 2:
        return true;
      default:
        return true;
    }
  };

  const addLocation = () => {
    const loc = locationInput.trim();
    if (loc && !form.locations.includes(loc)) {
      setForm({ ...form, locations: [...form.locations, loc] });
      setLocationInput("");
    }
  };

  const removeLocation = (loc: string) => {
    setForm({ ...form, locations: form.locations.filter((l) => l !== loc) });
  };

  const addAudience = () => {
    const aud = audienceInput.trim();
    if (aud && !form.audiences.includes(aud)) {
      setForm({ ...form, audiences: [...form.audiences, aud] });
      setAudienceInput("");
    }
  };

  const removeAudience = (aud: string) => {
    setForm({ ...form, audiences: form.audiences.filter((a) => a !== aud) });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          name: form.name,
          objective: form.objective,
          dailyBudget: Number(form.dailyBudget),
          targetLocations: form.locations,
          targetAudiences: form.audiences,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/campaigns/${data.id}`);
      }
    } catch {
      // handle error
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground">
          Set up a new campaign across Google Ads or Meta Ads.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-sm ${i === step ? "font-medium" : "text-muted-foreground"}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <Separator className="w-8" orientation="horizontal" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "Choose where you want to run your campaign."}
            {step === 1 && "Configure your campaign name, objective, and budget."}
            {step === 2 && "Define your target locations and audiences."}
            {step === 3 && "Review your campaign before launching."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Platform Selection */}
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setForm({ ...form, platform: "GOOGLE_ADS", objective: "" })}
                className={`rounded-lg border-2 p-6 text-left transition-colors ${
                  form.platform === "GOOGLE_ADS"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <h3 className="text-lg font-semibold">Google Ads</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Search, Display, Shopping, Video, and Performance Max
                  campaigns.
                </p>
              </button>
              <button
                onClick={() => setForm({ ...form, platform: "META_ADS", objective: "" })}
                className={`rounded-lg border-2 p-6 text-left transition-colors ${
                  form.platform === "META_ADS"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <h3 className="text-lg font-semibold">Meta Ads</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Facebook and Instagram campaigns for awareness, traffic,
                  leads, and sales.
                </p>
              </button>
            </div>
          )}

          {/* Step 1: Campaign Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Campaign Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Brand Awareness - US"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Objective</label>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {objectives.map((obj) => (
                    <button
                      key={obj.value}
                      onClick={() =>
                        setForm({ ...form, objective: obj.value })
                      }
                      className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
                        form.objective === obj.value
                          ? "border-primary bg-primary/5 font-medium"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {obj.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Daily Budget (USD)
                </label>
                <Input
                  type="number"
                  value={form.dailyBudget}
                  onChange={(e) =>
                    setForm({ ...form, dailyBudget: e.target.value })
                  }
                  placeholder="50.00"
                  min="1"
                  step="0.01"
                  className="mt-1 max-w-xs"
                />
              </div>
            </div>
          )}

          {/* Step 2: Targeting */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Target Locations</label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="e.g., New York, California, US"
                    onKeyDown={(e) => e.key === "Enter" && addLocation()}
                  />
                  <Button variant="outline" onClick={addLocation}>
                    Add
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.locations.map((loc) => (
                    <Badge
                      key={loc}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeLocation(loc)}
                    >
                      {loc} &times;
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Target Audiences</label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={audienceInput}
                    onChange={(e) => setAudienceInput(e.target.value)}
                    placeholder="e.g., Small business owners, Tech enthusiasts"
                    onKeyDown={(e) => e.key === "Enter" && addAudience()}
                  />
                  <Button variant="outline" onClick={addAudience}>
                    Add
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.audiences.map((aud) => (
                    <Badge
                      key={aud}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeAudience(aud)}
                    >
                      {aud} &times;
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Platform</p>
                    <p className="font-medium">
                      {form.platform === "GOOGLE_ADS"
                        ? "Google Ads"
                        : "Meta Ads"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Campaign Name
                    </p>
                    <p className="font-medium">{form.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Objective</p>
                    <p className="font-medium">{form.objective}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Daily Budget
                    </p>
                    <p className="font-medium">
                      {formatCurrency(Number(form.dailyBudget))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Locations</p>
                    <div className="flex flex-wrap gap-1">
                      {form.locations.length > 0
                        ? form.locations.map((l) => (
                            <Badge key={l} variant="outline">
                              {l}
                            </Badge>
                          ))
                        : <span className="text-sm">All locations</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Audiences</p>
                    <div className="flex flex-wrap gap-1">
                      {form.audiences.length > 0
                        ? form.audiences.map((a) => (
                            <Badge key={a} variant="outline">
                              {a}
                            </Badge>
                          ))
                        : <span className="text-sm">Broad audience</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? "Previous" : "Cancel"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Launch Campaign
          </Button>
        )}
      </div>
    </div>
  );
}
