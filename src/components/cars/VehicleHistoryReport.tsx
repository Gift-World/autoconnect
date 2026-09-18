import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  checkUkDvlaMot, 
  checkJapaneseJevic, 
  checkNtsaTims, 
  checkAkiInsurance 
} from "@/lib/vehicle-history.functions";
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

interface VehicleHistoryReportProps {
  carId: string;
  country: string;
  vin?: string;
  regNumber?: string;
}

export function VehicleHistoryReport({ carId, country, vin, regNumber }: VehicleHistoryReportProps) {
  const [reportType, setReportType] = useState<string | null>(null);
  
  const dvlaMutation = useMutation({
    mutationFn: () => checkUkDvlaMot({ data: { vrmOrVin: vin || regNumber || "TEST1234" } }),
  });
  
  const jevicMutation = useMutation({
    mutationFn: () => checkJapaneseJevic({ data: { chassisNumber: vin || "TEST1234" } }),
  });
  
  const ntsaMutation = useMutation({
    mutationFn: () => checkNtsaTims({ data: { regNumber: regNumber || "TEST1234" } }),
  });
  
  const akiMutation = useMutation({
    mutationFn: () => checkAkiInsurance({ data: { regNumber: regNumber || "TEST1234" } }),
  });

  const generateReport = () => {
    // Pick the right report based on country
    if (country === "GB") {
      setReportType("dvla");
      dvlaMutation.mutate();
    } else if (country === "JP") {
      setReportType("jevic");
      jevicMutation.mutate();
    } else if (country === "KE") {
      setReportType("ntsa");
      ntsaMutation.mutate();
      akiMutation.mutate();
    } else {
      // Default fallback
      setReportType("dvla");
      dvlaMutation.mutate();
    }
  };

  const isLoading = dvlaMutation.isPending || jevicMutation.isPending || ntsaMutation.isPending;

  return (
    <Card className="mt-8 border-border">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Automated Vehicle History
            </CardTitle>
            <CardDescription>
              Verify MOT, odometer, accidents, and finance records instantly.
            </CardDescription>
          </div>
          {!reportType && (
            <Button onClick={generateReport} disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate Report
            </Button>
          )}
        </div>
      </CardHeader>
      
      {reportType === "dvla" && dvlaMutation.isSuccess && dvlaMutation.data && (
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">MOT Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {dvlaMutation.data.motStatus} until {dvlaMutation.data.motExpiryDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Odometer History</h4>
                  <p className="text-sm text-muted-foreground">
                    Last recorded: {dvlaMutation.data.odometerHistory[0]?.value.toLocaleString()} {dvlaMutation.data.odometerHistory[0]?.unit}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h4 className="font-semibold mb-2">Recent MOT Tests</h4>
              {dvlaMutation.data.recentTests.map((test, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span>{new Date(test.completedDate).toLocaleDateString()}</span>
                  <Badge variant={test.testResult === "PASSED" ? "default" : "destructive"}>
                    {test.testResult}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}

      {reportType === "jevic" && jevicMutation.isSuccess && jevicMutation.data && (
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">JEVIC Export Certificate</h4>
                  <p className="text-sm text-muted-foreground">Status: {jevicMutation.data.status.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Odometer Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    Export KM: {jevicMutation.data.exportOdometerKm.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Auction Grade</span>
                <span className="font-bold">{jevicMutation.data.auctionGrade}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Radiation Check</span>
                <span className="font-bold">{jevicMutation.data.radiationLevel}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Cert Number</span>
                <span className="font-mono">{jevicMutation.data.inspectionCertificateNumber}</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
      
      {reportType === "ntsa" && ntsaMutation.isSuccess && ntsaMutation.data && (
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${ntsaMutation.data.encumbranceStatus === "CLEAN_NO_CAVEATS" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {ntsaMutation.data.encumbranceStatus === "CLEAN_NO_CAVEATS" ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-semibold">NTSA Encumbrance Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {ntsaMutation.data.encumbranceStatus.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              {akiMutation.isSuccess && akiMutation.data && (
                <div className="flex items-center gap-3 border-b pb-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">AKI Insurance Record</h4>
                    <p className="text-sm text-muted-foreground">
                      Status: {akiMutation.data.policyStatus} ({akiMutation.data.salvageRegistryStatus.replace(/_/g, " ")})
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Duty Status</span>
                <span className="font-bold">{ntsaMutation.data.dutyPaidStatus.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Owner Type</span>
                <span className="font-bold">{ntsaMutation.data.registeredOwnerType}</span>
              </div>
              {ntsaMutation.data.financierName && (
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Financier</span>
                  <span className="font-bold">{ntsaMutation.data.financierName}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
      
      {dvlaMutation.isError && <div className="p-4 text-red-500">Failed to generate report.</div>}
    </Card>
  );
}
