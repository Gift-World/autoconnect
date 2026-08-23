import { useState } from "react";
import {
  Store,
  Car,
  CheckCircle2,
  Clock,
  QrCode,
  Search,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  ArrowUpDown,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VehicleImage } from "@/components/VehicleImage";

export interface YardVehicle {
  id: string;
  title: string;
  year: number;
  price: string;
  vin?: string;
  bayNumber: string;
  inspectionStatus: "verified" | "in_progress" | "pending" | "conditional";
  reservationStatus: "available" | "reserved" | "gate_pass_issued" | "sold";
  imageUrl?: string;
  updatedAt: string;
}

const INITIAL_YARD_VEHICLES: YardVehicle[] = [
  {
    id: "yard-car-1",
    title: "Toyota Land Cruiser Prado TX-L 2.8D",
    year: 2021,
    price: "KES 6,850,000",
    vin: "JTEBX3FJ8M0291844",
    bayNumber: "Bay A-01 (Showroom Front)",
    inspectionStatus: "verified",
    reservationStatus: "reserved",
    imageUrl: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&auto=format&fit=crop&q=60",
    updatedAt: "10 mins ago",
  },
  {
    id: "yard-car-2",
    title: "Mercedes-Benz C200 AMG Line",
    year: 2020,
    price: "KES 4,800,000",
    vin: "WDD2050772R189421",
    bayNumber: "Bay A-04 (Executive Row)",
    inspectionStatus: "verified",
    reservationStatus: "available",
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=60",
    updatedAt: "25 mins ago",
  },
  {
    id: "yard-car-3",
    title: "Toyota Harrier Hybrid G-Edition",
    year: 2021,
    price: "KES 4,450,000",
    vin: "AXUH80-0042918",
    bayNumber: "Bay B-02 (Yard Central)",
    inspectionStatus: "verified",
    reservationStatus: "available",
    imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60",
    updatedAt: "1 hour ago",
  },
  {
    id: "yard-car-4",
    title: "BMW 530i M Sport",
    year: 2021,
    price: "KES 5,400,000",
    vin: "WBAJA7200M0829141",
    bayNumber: "Bay B-07 (Inspection Staging)",
    inspectionStatus: "verified",
    reservationStatus: "gate_pass_issued",
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=60",
    updatedAt: "2 hours ago",
  },
  {
    id: "yard-car-5",
    title: "Toyota Hilux Double Cab 4x4",
    year: 2021,
    price: "KES 4,600,000",
    vin: "AHTBA3CD907812903",
    bayNumber: "Bay C-01 (Arrival Bay)",
    inspectionStatus: "verified",
    reservationStatus: "available",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=60",
    updatedAt: "Today",
  },
];

const AVAILABLE_BAYS = [
  "Bay A-01 (Showroom Front)",
  "Bay A-02 (Showroom Front)",
  "Bay A-03 (Showroom Front)",
  "Bay A-04 (Executive Row)",
  "Bay A-05 (Executive Row)",
  "Bay B-01 (Yard Central)",
  "Bay B-02 (Yard Central)",
  "Bay B-03 (Yard Central)",
  "Bay B-07 (Inspection Staging)",
  "Bay C-01 (Arrival Bay)",
  "Bay C-02 (Arrival Bay)",
  "VIP Delivery Suite",
];

export function YardInventoryManager({ yardName = "Ngong Road Mega Yard Hub" }: { yardName?: string }) {
  const [vehicles, setVehicles] = useState<YardVehicle[]>(INITIAL_YARD_VEHICLES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVehicle, setSelectedVehicle] = useState<YardVehicle | null>(null);
  const [gatePassModalVehicle, setGatePassModalVehicle] = useState<YardVehicle | null>(null);
  const [editBayModalVehicle, setEditBayModalVehicle] = useState<YardVehicle | null>(null);
  const [targetBay, setTargetBay] = useState<string>("");

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.bayNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.vin && v.vin.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "reserved") return v.reservationStatus === "reserved";
    if (statusFilter === "gate_pass") return v.reservationStatus === "gate_pass_issued";
    if (statusFilter === "verified") return v.inspectionStatus === "verified";
    if (statusFilter === "needs_inspection") return v.inspectionStatus === "pending" || v.inspectionStatus === "in_progress";
    return true;
  });

  const handleUpdateInspection = (carId: string, newStatus: YardVehicle["inspectionStatus"]) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === carId ? { ...v, inspectionStatus: newStatus, updatedAt: "Just now" } : v))
    );
    toast.success("Inspection Status Synced", {
      description: `Vehicle Passport updated to ${newStatus.replace("_", " ").toUpperCase()}`,
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    });
  };

  const handleUpdateReservation = (carId: string, newStatus: YardVehicle["reservationStatus"]) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === carId ? { ...v, reservationStatus: newStatus, updatedAt: "Just now" } : v))
    );
    toast.success("Reservation Status Updated", {
      description: `Car is now marked as ${newStatus.replace("_", " ").toUpperCase()}`,
      icon: <Sparkles className="h-4 w-4 text-primary" />,
    });
  };

  const handleSaveBay = () => {
    if (!editBayModalVehicle || !targetBay) return;
    setVehicles((prev) =>
      prev.map((v) => (v.id === editBayModalVehicle.id ? { ...v, bayNumber: targetBay, updatedAt: "Just now" } : v))
    );
    toast.success(`Assigned to ${targetBay}`);
    setEditBayModalVehicle(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active Bay Capacity</span>
            <Store className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-foreground">{vehicles.length} / 24</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            19 bays ready for intake
          </span>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Passport Verified</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-foreground">
            {vehicles.filter((v) => v.inspectionStatus === "verified").length}
          </p>
          <span className="text-[11px] text-muted-foreground">100% digital checkmarks</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Escrow Reserved</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-foreground">
            {vehicles.filter((v) => v.reservationStatus === "reserved").length}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Deposit secured</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Gate Pass Ready</span>
            <KeyRound className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-foreground">
            {vehicles.filter((v) => v.reservationStatus === "gate_pass_issued").length}
          </p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Handover clearance</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by car, VIN number, or assigned bay..."
            className="pl-8 text-xs h-9 bg-background"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="h-8 text-xs px-2.5"
          >
            All ({vehicles.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "reserved" ? "default" : "outline"}
            onClick={() => setStatusFilter("reserved")}
            className="h-8 text-xs px-2.5"
          >
            Reserved ({vehicles.filter((v) => v.reservationStatus === "reserved").length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "gate_pass" ? "default" : "outline"}
            onClick={() => setStatusFilter("gate_pass")}
            className="h-8 text-xs px-2.5"
          >
            Gate Pass Ready
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "verified" ? "default" : "outline"}
            onClick={() => setStatusFilter("verified")}
            className="h-8 text-xs px-2.5"
          >
            Verified Only
          </Button>
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-3">
        {filteredVehicles.map((car) => (
          <div
            key={car.id}
            className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Left: Car info */}
            <div className="flex items-center gap-3.5">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                <VehicleImage
                  src={car.imageUrl}
                  alt={car.title}
                  year={car.year}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">
                    {car.year} {car.title}
                  </h4>
                  <span className="text-xs font-semibold text-primary">{car.price}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      setEditBayModalVehicle(car);
                      setTargetBay(car.bayNumber);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 font-medium text-foreground hover:border-primary/50 transition"
                  >
                    <Store className="h-3 w-3 text-primary" />
                    {car.bayNumber}
                    <span className="text-[10px] text-muted-foreground underline ml-0.5">Edit</span>
                  </button>
                  {car.vin && (
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                      VIN: {car.vin}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions & Badges */}
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 border-t border-border/60 pt-2 sm:border-0 sm:pt-0">
              {/* Inspection Status Toggle */}
              <div className="flex items-center gap-1">
                <Select
                  value={car.inspectionStatus}
                  onValueChange={(v: YardVehicle["inspectionStatus"]) => handleUpdateInspection(car.id, v)}
                >
                  <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Inspection Passed
                      </span>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <Clock className="h-3.5 w-3.5" /> In Progress
                      </span>
                    </SelectItem>
                    <SelectItem value="pending">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5" /> Pending Check
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reservation Status */}
              <div className="flex items-center gap-1">
                <Select
                  value={car.reservationStatus}
                  onValueChange={(v: YardVehicle["reservationStatus"]) => handleUpdateReservation(car.id, v)}
                >
                  <SelectTrigger className="h-8 text-xs w-[145px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available for View</SelectItem>
                    <SelectItem value="reserved">Reserved (Escrow)</SelectItem>
                    <SelectItem value="gate_pass_issued">Gate Pass Issued</SelectItem>
                    <SelectItem value="sold">Handover Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gate Pass Action */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setGatePassModalVehicle(car)}
                className="h-8 gap-1 text-xs border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
              >
                <QrCode className="h-3.5 w-3.5" /> Gate Pass
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Gate Pass Modal */}
      <Dialog open={!!gatePassModalVehicle} onOpenChange={() => setGatePassModalVehicle(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Digital Gate Pass & Handover Slip
            </DialogTitle>
            <DialogDescription>
              Authorized gate clearance code for vehicle collection from {yardName}.
            </DialogDescription>
          </DialogHeader>
          {gatePassModalVehicle && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                  Gate Release Token
                </p>
                <p className="text-2xl font-mono font-bold tracking-wider text-primary my-1">
                  GP-{gatePassModalVehicle.year}-{Math.abs(gatePassModalVehicle.title.length * 4821).toString().slice(0, 5)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Show this token or QR code at security check-in for physical drive-out.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span className="font-semibold text-foreground">{gatePassModalVehicle.title}</span>
                </div>
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Parking Bay:</span>
                  <span className="font-semibold text-foreground">{gatePassModalVehicle.bayNumber}</span>
                </div>
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Escrow Status:</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Funds Locked in Vault</Badge>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Mechanic Inspection:</span>
                  <span className="font-semibold text-emerald-600">42-Point Checkmark Certified</span>
                </div>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground"
                onClick={() => {
                  handleUpdateReservation(gatePassModalVehicle.id, "gate_pass_issued");
                  setGatePassModalVehicle(null);
                }}
              >
                Confirm Gate Pass Authorization
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bay Modal */}
      <Dialog open={!!editBayModalVehicle} onOpenChange={() => setEditBayModalVehicle(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Yard Parking Bay</DialogTitle>
            <DialogDescription>
              Select an available bay in {yardName} for this vehicle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Target Bay:
              </label>
              <Select value={targetBay} onValueChange={setTargetBay}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select parking bay" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_BAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditBayModalVehicle(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveBay} className="bg-primary text-primary-foreground">
                Save Bay Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
