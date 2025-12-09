import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Step {
    title: string;
    description: string;
}

interface MiniGuideProps {
    steps: Step[];
    title?: string;
    className?: string;
}

export function MiniGuide({ steps, title, className }: MiniGuideProps) {
    const { t } = useTranslation();

    return (
        <Card className={cn("bg-blue-50/50 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900", className)}>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">
                        {title || t('common.how_it_works')}
                    </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-2.5 items-start">
                            <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 text-xs font-bold mt-0.5">
                                {index + 1}
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100">{step.title}</h4>
                                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
