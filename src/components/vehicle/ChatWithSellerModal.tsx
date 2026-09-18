import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { InquiryThread } from "@/components/InquiryThread";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

export function ChatWithSellerModal({
  carId,
  sellerId,
  carTitle,
  customTrigger,
}: {
  carId: string;
  sellerId: string;
  carTitle: string;
  customTrigger?: React.ReactNode;
}) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && user) {
      checkExistingInquiry();
    }
  }, [open, user]);

  async function checkExistingInquiry() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id")
        .eq("car_id", carId)
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching inquiry:", error);
      }
      
      if (data) {
        setInquiryId(data.id);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstMessage.trim() || !user || sending) return;
    
    setSending(true);
    try {
      // 1. Create inquiry
      const { data: inquiry, error: inquiryError } = await supabase
        .from("inquiries")
        .insert({
          car_id: carId,
          seller_id: sellerId,
          buyer_id: user.id,
          buyer_name: profile?.full_name || user.email?.split('@')[0] || "Buyer",
          buyer_email: user.email || "",
          buyer_phone: profile?.phone || null,
          buyer_country: profile?.country || "US",
          message: firstMessage,
          inquiry_type: "general"
        })
        .select()
        .single();
        
      if (inquiryError) throw inquiryError;
      
      setInquiryId(inquiry.id);
      
    } catch (err) {
      toast.error("Could not start chat. Please try again.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const onOpenChange = (newOpen: boolean) => {
    if (newOpen && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {customTrigger || (
          <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md btn-press">
            <MessageCircle className="h-4 w-4" /> Chat with Dealer Live
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[85vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/60">
        <DialogHeader className="px-4 py-3 border-b border-border/50 shrink-0 bg-muted/20">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            Live Chat: {carTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 bg-background/50">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inquiryId ? (
            <div className="flex-1 min-h-0 p-3 sm:p-4 pb-4">
              <InquiryThread inquiryId={inquiryId} selfRole="buyer" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Start a Live Chat</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                  Send your first message to the dealer to instantly open a live negotiation channel.
                </p>
              </div>
              
              <form onSubmit={handleStartChat} className="w-full max-w-sm mt-4 flex gap-2">
                <Input 
                  placeholder="Hi, is this available?" 
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={!firstMessage.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
