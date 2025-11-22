import { useState, useEffect } from "react";
import { Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { propertiesService } from "@/services/properties";

interface MpesaPaymentFormProps {
  amount: number;
  propertyId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MpesaPaymentForm({ 
  amount, 
  propertyId, 
  onSuccess, 
  onCancel 
}: MpesaPaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  // Poll payment status after STK push is initiated
  useEffect(() => {
    if (!paymentId || !isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await propertiesService.paymentStatus(paymentId, {
          query_safaricom: true
        });
        const status = response.data.status;

        if (status === 'completed') {
          setIsPolling(false);
          setIsProcessing(false);
          clearInterval(pollInterval);
          toast({
            title: "Payment Successful!",
            description: `KES ${amount.toLocaleString()} has been received.`,
          });
          onSuccess?.();
        } else if (status === 'cancelled') {
          setIsPolling(false);
          setIsProcessing(false);
          clearInterval(pollInterval);
          toast({
            title: "Payment Cancelled",
            description: "The payment was cancelled. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      setIsPolling(false);
      clearInterval(pollInterval);
      toast({
        title: "Payment Timeout",
        description: "Payment is taking longer than expected. Please check your payment status.",
        variant: "destructive",
      });
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [paymentId, isPolling, amount, toast, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number format (Tanzania/Kenya)
    const phoneRegex = /^(0|\+?254|\+?255)?[17]\d{8}$/;
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanedPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid M-Pesa registered phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Initiate STK Push via backend
      const response = await propertiesService.requestMpesaStk(propertyId, {
        phone: cleanedPhone,
        amount: amount,
      });

      if (response.data.success) {
        const checkoutRequestId = response.data.checkout_request_id;
        const newPaymentId = response.data.payment_id;

        setPaymentId(newPaymentId);
        setIsPolling(true);

        toast({
          title: "Payment Request Sent",
          description: response.data.message || 
            "Please check your phone and enter your M-Pesa PIN to complete the payment.",
        });
      } else {
        throw new Error(response.data.error || "Failed to initiate payment");
      }
    } catch (error: any) {
      setIsProcessing(false);
      const errorMessage = error.response?.data?.error || 
        error.message || 
        "Failed to initiate payment. Please try again.";
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>M-Pesa Payment</CardTitle>
            <CardDescription>Pay via mobile money (Tanzania)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount to Pay:</span>
              <span className="text-xl font-bold">KES {amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">M-Pesa Phone Number</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678 or +255712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10"
                required
                maxLength={15}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your M-Pesa registered phone number (e.g., 0712345678 or +255712345678)
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              📱 You will receive an STK push on your phone. Enter your M-Pesa PIN to complete the payment.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isProcessing || phoneNumber.length < 9}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isPolling ? "Waiting for payment..." : "Processing..."}
                </>
              ) : (
                "Pay Now"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}