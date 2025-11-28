import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Icons
const CheckIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const XIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Demo fallback data
const DEMO_PLANS = [
    {
        id: 1,
        title: "Starter",
        slug: "starter",
        price_monthly: "0",
        price_yearly: "0",
        highlight: false,
        features: [
            { feature: { code: "basic-listing", name: "Basic Listing", status: "active" }, included: true },
            { feature: { code: "analytics", name: "Basic Analytics", status: "coming_soon" }, included: false },
        ],
    },
    {
        id: 2,
        title: "Pro",
        slug: "pro",
        price_monthly: "20000",
        price_yearly: "200000",
        highlight: true,
        features: [
            { feature: { code: "basic-listing", name: "Basic Listing", status: "active" }, included: true },
            { feature: { code: "analytics", name: "Basic Analytics", status: "coming_soon" }, included: true },
            { feature: { code: "priority-support", name: "Priority Support", status: "active" }, included: true },
        ],
    },
    {
        id: 3,
        title: "Enterprise",
        slug: "enterprise",
        price_monthly: "Custom",
        price_yearly: "Custom",
        highlight: false,
        features: [
            { feature: { code: "basic-listing", name: "Basic Listing", status: "active" }, included: true },
            { feature: { code: "analytics", name: "Basic Analytics", status: "coming_soon" }, included: true },
            { feature: { code: "priority-support", name: "Priority Support", status: "active" }, included: true },
            { feature: { code: "white-glove", name: "White Glove Onboarding", status: "coming_soon" }, included: false },
        ],
    },
];

const DEMO_FEATURES = [
    { code: "basic-listing", name: "Basic Listing", description: "Create and publish basic property listings.", status: "active" },
    { code: "analytics", name: "Analytics Dashboard", description: "View listing performance and insights.", status: "coming_soon" },
    { code: "priority-support", name: "Priority Support", description: "Faster support response for subscribers.", status: "active" },
    { code: "white-glove", name: "White Glove Onboarding", description: "Custom migration and onboarding assistance.", status: "coming_soon" },
];

// Hook to fetch plans & features
function usePlansAndFeatures({ apiPaths = { plans: "/api/plans/", features: "/api/features/" }, mock = false } = {}) {
    const [plans, setPlans] = useState(null);
    const [features, setFeatures] = useState(null);
    const [loading, setLoading] = useState(!mock);
    const [error, setError] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (mock) {
            setPlans(DEMO_PLANS);
            setFeatures(DEMO_FEATURES);
            setLoading(false);
            setUsingFallback(true);
            return () => (mounted = false);
        }

        async function safeJson(res) {
            try {
                return await res.json();
            } catch (err) {
                console.warn("Response was not JSON or parsing failed", err, res);
                return null;
            }
        }

        async function load() {
            setLoading(true);
            try {
                const [pRes, fRes] = await Promise.all([
                    fetch(apiPaths.plans),
                    fetch(apiPaths.features),
                ]);

                if (!pRes.ok || !fRes.ok) {
                    const pText = await safeJson(pRes).catch(() => null);
                    const fText = await safeJson(fRes).catch(() => null);
                    const message = `Failed to load pricing data (plans ok=${pRes.ok}, features ok=${fRes.ok})`;
                    console.error(message, { plansBody: pText, featuresBody: fText });
                    throw new Error(message);
                }

                const plansJson = await safeJson(pRes);
                const featuresJson = await safeJson(fRes);

                if (!plansJson || !Array.isArray(plansJson)) throw new Error("/api/plans/ returned invalid data");
                if (!featuresJson || !Array.isArray(featuresJson)) throw new Error("/api/features/ returned invalid data");

                if (!mounted) return;
                setPlans(plansJson);
                setFeatures(featuresJson);
                setError(null);
                setUsingFallback(false);
            } catch (err) {
                console.error("usePlansAndFeatures error:", err);
                setError(err.message || String(err));

                if (mounted) {
                    setPlans(DEMO_PLANS);
                    setFeatures(DEMO_FEATURES);
                    setUsingFallback(true);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => (mounted = false);
    }, [apiPaths.plans, apiPaths.features, mock]);

    return { plans, features, loading, error, usingFallback };
}

// Billing toggle
function BillingToggle({ yearly, onChange }) {
    return (
        <div className="inline-flex items-center gap-3 bg-slate-100 p-1 rounded-lg">
            <button
                onClick={() => onChange(false)}
                className={`px-3 py-1 rounded-md ${!yearly ? "bg-white shadow" : ""}`}>
                Monthly
            </button>
            <button
                onClick={() => onChange(true)}
                className={`px-3 py-1 rounded-md ${yearly ? "bg-white shadow" : ""}`}>
                Yearly
            </button>
        </div>
    );
}

// Plan Card
function PlanCard({ plan, yearly, onSelect }) {
    const price = yearly ? plan.price_yearly : plan.price_monthly;
    return (
        <Card className={`p-4 ${plan.highlight ? "border-2 border-blue-500" : ""}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-semibold">{plan.title}</h3>
                    <div className="text-sm text-slate-500 mt-1">{plan.slug}</div>
                </div>
                {plan.highlight && <Badge>Popular</Badge>}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
                <div className="text-3xl font-bold">{price !== "0" && price !== "Custom" ? `TZS ${parseFloat(price).toLocaleString()}` : price === "0" ? "Free" : price}</div>
                <div className="text-sm text-slate-500">{yearly ? "/yr" : "/mo"}</div>
            </div>

            <div className="mt-4 space-y-2">
                {plan.features && plan.features.length ? (
                    plan.features.map((fItem) => (
                        fItem.included ? (
                            <div key={fItem.feature.code} className="flex items-center gap-2">
                                <CheckIcon className="text-green-600" />
                                <div className="text-sm">{fItem.feature.name}</div>
                                {fItem.feature.status === "coming_soon" && (
                                    <div className="ml-2 text-xs text-amber-600">(Coming Soon)</div>
                                )}
                            </div>
                        ) : null
                    ))
                ) : (
                    <div className="text-sm text-slate-500">No features configured.</div>
                )}
            </div>

            <div className="mt-6">
                <Button onClick={() => onSelect(plan)} className="w-full">
                    Choose {plan.title}
                </Button>
            </div>
        </Card>
    );
}

// Feature Comparison Table
function FeatureComparisonTable({ plans = [], features = [] }) {
    const rows = features;
    return (
        <div className="overflow-auto border rounded-lg">
            <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="p-3">Feature</th>
                        {plans.map((p) => (
                            <th key={p.id} className="p-3">{p.title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((f) => (
                        <tr key={f.code} className="border-t">
                            <td className="p-3 align-top">
                                <div className="flex items-center gap-2">
                                    <div className="font-medium">{f.name}</div>
                                    {f.status === "coming_soon" && <div className="text-xs text-amber-600">Coming Soon</div>}
                                    {f.status === "disabled" && <div className="text-xs text-slate-400">Disabled</div>}
                                </div>
                                <div className="text-xs text-slate-500">{f.description}</div>
                            </td>

                            {plans.map((p) => {
                                const includedObj = p.features && p.features.find((x) => x.feature && x.feature.code === f.code);
                                const included = includedObj ? includedObj.included : false;
                                return (
                                    <td key={p.id} className="p-3 align-top">
                                        {included ? <CheckIcon className="text-green-600" /> : <XIcon className="text-slate-400" />}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Main Pricing Page
export default function PricingPage({ apiPaths, mock = false, onSelectPlan } = {}) {
    const mergedApiPaths = {
        plans: (apiPaths && apiPaths.plans) || "/api/plans/",
        features: (apiPaths && apiPaths.features) || "/api/features/",
    };

    const { plans, features, loading, error, usingFallback } = usePlansAndFeatures({ apiPaths: mergedApiPaths, mock });
    const [yearly, setYearly] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const activeFeatures = useMemo(() => (features ? features.filter((f) => f.status !== "disabled") : []), [features]);

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-64 bg-slate-200 rounded" />
                        <div className="h-64 bg-slate-200 rounded" />
                        <div className="h-64 bg-slate-200 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Pricing & Plans</h1>
                    <p className="text-slate-500 mt-1">Choose a plan that fits your business. You can enable/disable features from the admin.</p>
                </div>
                <div className="flex items-center gap-4">
                    <BillingToggle yearly={yearly} onChange={setYearly} />
                    <Button variant="ghost">Contact Sales</Button>
                </div>
            </div>

            {error && (
                <div className="mb-4">
                    <Card>
                        <CardContent>
                            <div className="text-yellow-600">Warning: Could not load plans from server: {error}. Showing demo data.</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {plans && plans.length ? (
                    plans.map((p) => <PlanCard key={p.id} plan={p} yearly={yearly} onSelect={(plan) => { setSelectedPlan(plan); if (onSelectPlan) onSelectPlan(plan); }} />)
                ) : (
                    <div>No plans available</div>
                )}
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Feature comparison</h2>
                <FeatureComparisonTable plans={plans || []} features={features || []} />
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold">Need a custom plan?</h3>
                    <div className="text-sm text-slate-500">Contact our sales team to add bespoke features and onboarding support.</div>
                </div>
                <Button>Contact Sales</Button>
            </div>

            {selectedPlan && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold">Confirm Plan</h3>
                                <div className="text-sm text-slate-500">You selected: {selectedPlan.title}</div>
                            </div>
                            <button onClick={() => setSelectedPlan(null)} className="text-slate-500">Close</button>
                        </div>

                        <div className="mt-4">
                            <Button className="w-full">Proceed to Checkout</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
