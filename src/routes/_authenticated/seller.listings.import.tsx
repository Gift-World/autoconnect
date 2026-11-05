import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/seller/listings/import")({
  component: BulkImportListings,
});

function BulkImportListings() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDownloadTemplate = () => {
    const headers = [
      "make_name",
      "model_name",
      "year",
      "price",
      "currency",
      "country",
      "mileage",
      "condition",
      "transmission",
      "fuel_type",
      "vin"
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "autoconnect_inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV file.");
      return;
    }

    setIsUploading(true);
    
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("profile_id", u.user.id)
        .maybeSingle();

      if (!seller) throw new Error("Seller profile not found");

      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const record: Record<string, any> = {};
        headers.forEach((h, index) => {
          record[h] = values[index];
        });
        
        // Basic validation
        if (record.make_name && record.model_name && record.year && record.price) {
          records.push({
            seller_id: seller.id,
            title: `${record.year} ${record.make_name} ${record.model_name}`,
            make_name: record.make_name,
            model_name: record.model_name,
            year: parseInt(record.year),
            price: parseFloat(record.price),
            currency: record.currency || 'USD',
            country: record.country || 'KE',
            mileage: parseInt(record.mileage) || null,
            condition: record.condition || 'foreign-used',
            transmission: record.transmission || null,
            fuel_type: record.fuel_type || null,
            vin: record.vin || null,
            status: "pending"
          });
        }
      }

      if (records.length === 0) {
        toast.error("No valid records found in the CSV.");
        return;
      }

      const { error } = await supabase.from('cars').insert(records);
      
      if (error) throw error;
      
      toast.success(`Successfully imported ${records.length} vehicles!`);
      navigate({ to: "/seller" });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to process CSV file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Bulk Import"
        description="Upload multiple vehicles at once using a CSV file."
        crumbs={[{ label: "Seller", to: "/seller" }, { label: "Bulk import" }]}
        actions={
          <Button asChild variant="outline" className="h-11 rounded-full">
            <Link to="/seller">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
          <p className="brand-kicker text-muted-foreground">Step 1</p>
          <h2 className="font-brand mt-2 text-2xl sm:text-3xl">Download Template</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Start with our standard format to ensure your data imports correctly.
          </p>
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="mt-5 h-11 rounded-full"
          >
            <FileSpreadsheet className="h-4 w-4" /> Download CSV Template
          </Button>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Columns: make_name, model_name, year, price, currency, country, mileage, condition,
            transmission, fuel_type, vin. Make, model, year and price are required on every row.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
          <p className="brand-kicker text-muted-foreground">Step 2</p>
          <h2 className="font-brand mt-2 text-2xl sm:text-3xl">Upload Inventory</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Drag and drop your completed CSV file here.
          </p>
          <label
            className={`mt-5 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-colors focus-within:ring-2 focus-within:ring-ring ${
              dragActive
                ? "border-ac-accent bg-ac-accent/10"
                : "border-border hover:border-ac-accent/60 hover:bg-muted/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <span className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                <span>Importing inventory...</span>
              </span>
            ) : (
              <span className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="mb-2 grid h-14 w-14 place-items-center rounded-full bg-ac-accent text-ac-ink">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  Drag & drop your CSV file here
                </span>
                <span className="text-xs">or click to browse files</span>
              </span>
            )}
            <input
              type="file"
              accept=".csv"
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
                e.target.value = "";
              }}
            />
          </label>
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-foreground" />
            <p>
              Imported vehicles will be saved as "Pending" and will require review before going
              live. Photos must be added manually after import.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
