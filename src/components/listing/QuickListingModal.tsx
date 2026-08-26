import { useState } from "react";
import { 
  PlusCircle, 
  Car, 
  DollarSign, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Sparkles,
  Check,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";

const SAMPLE_PHOTO_PRESETS = [
  { label: "Luxury SUV (White)", url: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1200&q=80" },
  { label: "Performance Sedan (Dark)", url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80" },
  { label: "Sport Coupe (Red)", url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80" },
  { label: "Electric Crossover", url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80" },
];

const POPULAR_FEATURES = [
  "Sunroof / Moonroof",
  "Leather Heated Seats",
  "360 Surround Camera",
  "Keyless Smart Entry",
  "Apple CarPlay & Android Auto",
  "Adaptive Cruise Control",
  "Blind Spot Monitoring",
  "Ceramic Brake Package"
];

interface QuickListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated?: (car: any) => void;
}

export function QuickListingModal({ isOpen, onClose, onListingCreated }: QuickListingModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    make_name: "",
    model_name: "",
    year: new Date().getFullYear(),
    price: "",
    currency: "USD",
    country: "KE",
    city: "Nairobi",
    transmission: "Automatic",
    fuel_type: "Gasoline",
    body_type: "SUV",
    mileage: "",
    selectedImage: SAMPLE_PHOTO_PRESETS[0].url,
    features: ["Sunroof / Moonroof", "Leather Heated Seats"],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFeature = (feat: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feat)
        ? prev.features.filter(f => f !== feat)
        : [...prev.features, feat]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make_name.trim() || !formData.model_name.trim() || !formData.price) {
      toast.error("Please fill in the required vehicle details.");
      return;
    }

    setIsSubmitting(true);

    const title = `${formData.year} ${formData.make_name.trim()} ${formData.model_name.trim()}`;
    const newCar = {
      id: `custom-${Date.now().toString(36)}`,
      title,
      make_name: formData.make_name.trim(),
      model_name: formData.model_name.trim(),
      year: Number(formData.year),
      price: Number(formData.price),
      currency: formData.currency,
      country: formData.country,
      city: formData.city,
      location_display: `${formData.city}, ${formData.country}`,
      mileage: formData.mileage ? Number(formData.mileage) : 15000,
      mileage_unit: "km",
      transmission: formData.transmission,
      fuel_type: formData.fuel_type,
      body_type: formData.body_type,
      available_for_export: true,
      right_hand_drive: formData.country === "KE" || formData.country === "JP" || formData.country === "UK",
      featured: true,
      created_at: new Date().toISOString(),
      car_images: [
        { image_url: formData.selectedImage, is_primary: true, sort_order: 0 }
      ],
      features: formData.features
    };

    // Save in local storage
    try {
      const existing = JSON.parse(localStorage.getItem("autoconnect_custom_listings") || "[]");
      existing.unshift(newCar);
      localStorage.setItem("autoconnect_custom_listings", JSON.stringify(existing));
    } catch (_) {
      // ignore
    }

    setIsSubmitting(false);
    toast.success("Listing Published to Registry!", {
      description: `"${title}" is now visible across the live showroom.`,
    });

    if (onListingCreated) {
      onListingCreated(newCar);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background text-foreground border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <PlusCircle className="w-5 h-5 text-teal-500" />
            <span>List a Vehicle on AutoConnect</span>
          </DialogTitle>
          <DialogDescription>
            Simulate publishing a vehicle to the global verified showroom.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* 1. Make & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Make / Manufacturer *</Label>
              <Input
                placeholder="e.g. Toyota, Mercedes-Benz, Porsche"
                value={formData.make_name}
                onChange={(e) => setFormData({ ...formData, make_name: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Model & Trim *</Label>
              <Input
                placeholder="e.g. Land Cruiser 300, GLE 450"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* 2. Year, Price, Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Model Year *</Label>
              <Input
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Price *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 45000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(val) => setFormData({ ...formData, currency: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="KSh">KSh (Kenya)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Location, Transmission, Fuel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Country Location</Label>
              <Select
                value={formData.country}
                onValueChange={(val) => setFormData({ ...formData, country: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Transmission</Label>
              <Select
                value={formData.transmission}
                onValueChange={(val) => setFormData({ ...formData, transmission: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Dual-Clutch">Dual-Clutch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Fuel Type</Label>
              <Select
                value={formData.fuel_type}
                onValueChange={(val) => setFormData({ ...formData, fuel_type: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gasoline">Gasoline / Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Hybrid">Hybrid / PHEV</SelectItem>
                  <SelectItem value="Electric">100% Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 4. Showroom Photo Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
              <span>Select High-Res Demo Showroom Photo</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, selectedImage: preset.url })}
                  className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${
                    formData.selectedImage === preset.url
                      ? "border-teal-500 ring-2 ring-teal-500/30"
                      : "border-border/80 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={preset.url} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[10px] text-white py-0.5 text-center truncate px-1">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Popular Features */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>Installed Features & Options</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_FEATURES.map((feat) => {
                const isSelected = formData.features.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleFeature(feat)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold"
                        : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-teal-500" />}
                    <span>{feat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Publish to Showroom</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
