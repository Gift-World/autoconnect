import { useState } from "react";
import { Send, CheckCircle2, Phone, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DrawerInquiryFormProps {
  carId: string;
  carTitle: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
}

export function DrawerInquiryForm({
  carTitle,
  sellerName = "Verified Seller",
  sellerPhone,
  sellerEmail,
}: DrawerInquiryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "Test Drive Request",
    message: `Hi, I am interested in this ${carTitle}. Is it currently available for viewing/inspection?`,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please provide your name and email address.");
      return;
    }

    setSubmitted(true);
    toast.success("Inquiry Dispatched", {
      description: `Your ${formData.inquiryType.toLowerCase()} for "${carTitle}" was delivered to ${sellerName}.`,
    });
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
      {/* Seller Quick Contact Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h4 className="text-sm font-bold text-foreground">{sellerName}</h4>
          <p className="text-xs text-muted-foreground">Certified AutoConnect Seller</p>
        </div>
        <div className="flex items-center gap-2">
          {sellerPhone && (
            <a
              href={`tel:${sellerPhone}`}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-teal-500" />
              <span>Call</span>
            </a>
          )}
          {sellerEmail && (
            <a
              href={`mailto:${sellerEmail}?subject=AutoConnect Inquiry: ${carTitle}`}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-sky-500" />
              <span>Email</span>
            </a>
          )}
        </div>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-5 text-center space-y-2 animate-fade-in">
          <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
          <h5 className="text-sm font-bold text-teal-300">Message Delivered to {sellerName}</h5>
          <p className="text-xs text-muted-foreground">
            The seller has received your contact request and will get back to you shortly.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSubmitted(false)}
            className="text-xs text-teal-400 hover:text-teal-300 mt-2"
          >
            Send another inquiry
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5 text-teal-500" />
            <span>Send Direct Private Inquiry</span>
          </div>

          {/* Quick Inquiry Type Pills */}
          <div className="grid grid-cols-2 gap-1.5">
            {["Test Drive Request", "Offer Inquiry", "Inspection Report", "Availability"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, inquiryType: type })}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-left transition-all truncate ${
                  formData.inquiryType === type
                    ? "border-teal-500 bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Your Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-9 text-xs"
              required
            />
            <Input
              type="email"
              placeholder="Your Email *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-9 text-xs"
              required
            />
          </div>

          <Input
            type="tel"
            placeholder="Phone Number (Optional for WhatsApp updates)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="h-9 text-xs"
          />

          <Textarea
            rows={2}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Write your note to seller..."
            className="text-xs"
          />

          <Button type="submit" size="sm" className="w-full gap-2 text-xs font-bold">
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Inquiry to Seller</span>
          </Button>
        </form>
      )}
    </div>
  );
}
