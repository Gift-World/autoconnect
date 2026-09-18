import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/seller">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Import</h1>
          <p className="text-sm text-muted-foreground">
            Upload multiple vehicles at once using a CSV file.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Download Template</CardTitle>
          <CardDescription>Start with our standard format to ensure your data imports correctly.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Upload Inventory</CardTitle>
          <CardDescription>Drag and drop your completed CSV file here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Importing inventory...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Drag & drop your CSV file here</p>
                <p className="text-xs">or click to browse files</p>
                <input
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  style={{ position: 'relative', marginTop: '-100px', height: '100px' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
            <p>Imported vehicles will be saved as "Pending" and will require review before going live. Photos must be added manually after import.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
