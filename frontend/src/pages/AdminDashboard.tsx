import { ShieldCheck, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="max-w-xl w-full text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Administrator Console</CardTitle>
          <CardDescription>
            Superuser management lives in the Django admin dashboard for full control and auditing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use the button below to open the SmartDalali admin console. From there you can manage users,
            listings, payments, conversations, and support tickets using the native Django interface.
          </p>
          <Button asChild className="gap-2">
            <a href="/admin/" target="_blank" rel="noreferrer">
              Open Django Admin
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
