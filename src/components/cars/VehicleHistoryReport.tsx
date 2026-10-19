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
  const providerName = country === "KE" ? "NTSA and insurance" : country === "JP" ? "Japanese inspection" : "DVLA MOT";
  const hasReference = Boolean(vin || regNumber);
  const canRequest = country === "GB" && hasReference;
  
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
      setReportType("unavailable");
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
              Vehicle history evidence
            </CardTitle>
            <CardDescription>
              Official records appear only when the relevant provider connection is active. We never manufacture a check result.
            </CardDescription>
          </div>
          {!reportType && (
            <Button onClick={generateReport} disabled={isLoading || !canRequest} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {canRequest ? "Check official MOT record" : `${providerName} connection pending`}
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
      
      {(reportType === "unavailable" || dvlaMutation.isError || jevicMutation.isError || ntsaMutation.isError || akiMutation.isError) && (
        <CardContent className="pt-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">No verified history report is available yet.</p>
            <p className="mt-1 leading-5 text-amber-900">{dvlaMutation.error?.message || jevicMutation.error?.message || ntsaMutation.error?.message || akiMutation.error?.message || "This vehicle’s provider connection is not active. Ask the seller for original evidence or arrange an independent inspection."}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
