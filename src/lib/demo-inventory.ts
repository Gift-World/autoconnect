export interface DemoCar {
  id: string;
  seller_id: string;
  title: string;
  make_name: string;
  model_name: string;
  year: number;
  price: number;
  currency: string;
  country: string;
  city: string;
  location_display: string;
  mileage: number;
  mileage_unit: string;
  transmission: string;
  fuel_type: string;
  body_type: string;
  color: string;
  engine_size: string;
  condition: string;
  description: string;
  right_hand_drive: boolean;
  steering_side: string;
  available_for_export: boolean;
  shipping_info: string;
  import_duties_note: string;
  vin: string;
  featured: boolean;
  views: number;
  created_at: string;
  documents_verified: boolean;
  ntsa_verified: boolean;
  inspection_verified: boolean;
  pay_full: boolean;
  pay_deposit: boolean;
  pay_installments: boolean;
  deposit_percent: number;
  installment_months: number;
  installment_interest_rate: number;
  installment_monthly: number;
  yard_id: string;
  car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
  car_yards: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    city: string | null;
    country: string;
    is_approved: boolean;
  } | null;
  sellers: {
    id: string;
    business_name: string | null;
    country: string;
    city: string | null;
    location_display: string | null;
    is_verified: boolean;
    verification_badge: boolean;
    is_dealer: boolean;
    offers_local_pickup: boolean;
    offers_domestic_shipping: boolean;
    offers_international_shipping: boolean;
  } | null;
}

export interface DemoYard {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  country: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  opening_hours: string | null;
  is_featured: boolean;
  sellers: { verification_badge: boolean; is_verified: boolean } | null;
}

export const DEMO_YARDS: DemoYard[] = [
  {
    id: "yard-1",
    slug: "nairobi-hub",
    name: "AutoConnect Nairobi Central Yard",
    tagline: "Premier Verified Logistics Hub & Inspection Center",
    description: "Located on Ngong Road, Nairobi. Fully equipped with multi-point automated vehicle diagnostic bays, secure escrow storage, physical vehicle viewing, and automated biometric gate pass issuance.",
    logo_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&auto=format&fit=crop&q=80",
    cover_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&auto=format&fit=crop&q=80",
    country: "KE",
    city: "Nairobi",
    address: "Ngong Road, Junction Bay 14, Nairobi",
    phone: "+254 700 889 900",
    whatsapp: "+254 700 889 900",
    email: "nairobi.yard@autoconnect.dev",
    opening_hours: "Mon - Sat: 8:00 AM - 6:30 PM",
    is_featured: true,
    sellers: { verification_badge: true, is_verified: true },
  },
  {
    id: "yard-2",
    slug: "mombasa-port-hub",
    name: "Mombasa Port Logistics & Customs Yard",
    tagline: "KPA Port Customs Clearance & Clearing Bay",
    description: "Direct access to Kilindini Harbour, Port of Mombasa. Specialized in KRA customs duty clearance, KEBS verification, and secure container de-stuffing.",
    logo_url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&auto=format&fit=crop&q=80",
    cover_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&auto=format&fit=crop&q=80",
    country: "KE",
    city: "Mombasa",
    address: "Mbaraki Port Access Rd, Mombasa Port",
    phone: "+254 711 334 455",
    whatsapp: "+254 711 334 455",
    email: "mombasa.logistics@autoconnect.dev",
    opening_hours: "24/7 Port Logistics Operations",
    is_featured: true,
    sellers: { verification_badge: true, is_verified: true },
  },
  {
    id: "yard-3",
    slug: "yokohama-export-terminal",
    name: "Yokohama Direct Export Terminal",
    tagline: "JEVIC & QISJ Certified Export Bay Japan",
    description: "Honmoku Pier, Yokohama Port. Full pre-shipment radiation inspection, genuine odometer verification, and RoRo/Container shipping directly to East Africa.",
    logo_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=80",
    cover_url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop&q=80",
    country: "JP",
    city: "Yokohama",
    address: "Honmoku Pier 7, Naka Ward, Yokohama, Kanagawa",
    phone: "+81 45 228 9011",
    whatsapp: "+81 90 1234 5678",
    email: "export@yokohamaexport.jp",
    opening_hours: "Mon - Fri: 9:00 AM - 6:00 PM JST",
    is_featured: true,
    sellers: { verification_badge: true, is_verified: true },
  },
];

export const DEMO_CARS: DemoCar[] = [
  {
    id: "car-1",
    seller_id: "demo-seller-kenji",
    title: "2021 Toyota Land Cruiser Prado TX-L 2.8D",
    make_name: "Toyota",
    model_name: "Land Cruiser Prado",
    year: 2021,
    price: 6850000,
    currency: "KES",
    country: "KE",
    city: "Nairobi",
    location_display: "Nairobi, Kenya (In Yard)",
    mileage: 42300,
    mileage_unit: "km",
    transmission: "Automatic",
    fuel_type: "Diesel",
    body_type: "SUV",
    color: "Pearl White",
    engine_size: "2800cc (1GD-FTV)",
    condition: "Foreign Used - Grade 4.5A",
    description: "Mint condition 2021 Land Cruiser Prado TX-L package. 7-seater leather interior, sunroof, 360-degree cameras, radar cruise control, KDSS suspension, genuine verified mileage, clean NTSA TIMS logbook available for instant transfer via escrow.",
    right_hand_drive: true,
    steering_side: "right",
    available_for_export: true,
    shipping_info: "Available for immediate pickup in Nairobi Yard or express domestic flatbed dispatch to any East African county within 24 hours.",
    import_duties_note: "Fully duty paid. KRA tax clearance certificate and KEBS inspection certificate included.",
    vin: "JTEBX3FJ8M0291844",
    featured: true,
    views: 1842,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    documents_verified: true,
    ntsa_verified: true,
    inspection_verified: true,
    pay_full: true,
    pay_deposit: true,
    pay_installments: true,
    deposit_percent: 20,
    installment_months: 24,
    installment_interest_rate: 11.5,
    installment_monthly: 256000,
    yard_id: "yard-1",
    car_images: [
      {
        image_url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80",
        is_primary: true,
        sort_order: 0,
      },
      {
        image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80",
        is_primary: false,
        sort_order: 1,
      },
      {
        image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80",
        is_primary: false,
        sort_order: 2,
      },
    ],
    car_yards: {
      id: "yard-1",
      slug: "nairobi-hub",
      name: "AutoConnect Nairobi Central Yard",
      logo_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&auto=format&fit=crop&q=80",
      city: "Nairobi",
      country: "KE",
      is_approved: true,
    },
    sellers: {
      id: "demo-seller-kenji",
      business_name: "Kenji Auto Export & Direct Motors",
      country: "KE",
      city: "Nairobi",
      location_display: "Nairobi, Kenya",
      is_verified: true,
      verification_badge: true,
      is_dealer: true,
      offers_local_pickup: true,
      offers_domestic_shipping: true,
      offers_international_shipping: true,
    },
  },
  {
    id: "car-2",
    seller_id: "demo-seller-kenji",
    title: "2020 Mazda CX-5 2.2D AWD Exclusive-Mode",
    make_name: "Mazda",
    model_name: "CX-5",
    year: 2020,
    price: 3450000,
    currency: "KES",
    country: "KE",
    city: "Nairobi",
    location_display: "Nairobi, Kenya",
    mileage: 38200,
    mileage_unit: "km",
    transmission: "Automatic",
    fuel_type: "Diesel",
    body_type: "SUV",
    color: "Soul Red Crystal",
    engine_size: "2200cc SkyActiv-D",
    condition: "Foreign Used - Grade 5A",
    description: "Top-tier Mazda CX-5 Exclusive Mode. Nappa leather seats with front ventilation, Bose 10-speaker premium audio, Head-Up Display (HUD), lane keep assist, smart brake support, power tailgate, clean history report with zero accident records.",
    right_hand_drive: true,
    steering_side: "right",
    available_for_export: true,
    shipping_info: "Located in Nairobi yard. Inspected with 150-point checklist.",
    import_duties_note: "All customs and import taxes cleared.",
    vin: "JM3KF4WLA00318921",
    featured: true,
    views: 1250,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    documents_verified: true,
    ntsa_verified: true,
    inspection_verified: true,
    pay_full: true,
    pay_deposit: true,
    pay_installments: true,
    deposit_percent: 25,
    installment_months: 18,
    installment_interest_rate: 12.0,
    installment_monthly: 162000,
    yard_id: "yard-1",
    car_images: [
      {
        image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&auto=format&fit=crop&q=80",
        is_primary: true,
        sort_order: 0,
      },
      {
        image_url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&auto=format&fit=crop&q=80",
        is_primary: false,
        sort_order: 1,
      },
    ],
    car_yards: {
      id: "yard-1",
      slug: "nairobi-hub",
      name: "AutoConnect Nairobi Central Yard",
      logo_url: null,
      city: "Nairobi",
      country: "KE",
      is_approved: true,
    },
    sellers: {
      id: "demo-seller-kenji",
      business_name: "Kenji Auto Export & Direct Motors",
      country: "KE",
      city: "Nairobi",
      location_display: "Nairobi, Kenya",
      is_verified: true,
      verification_badge: true,
      is_dealer: true,
      offers_local_pickup: true,
      offers_domestic_shipping: true,
      offers_international_shipping: true,
    },
  },
  {
    id: "car-3",
    seller_id: "demo-seller-kenji",
    title: "2019 Mercedes-Benz C200 AMG Line",
    make_name: "Mercedes-Benz",
    model_name: "C-Class",
    year: 2019,
    price: 4350000,
    currency: "KES",
    country: "KE",
    city: "Nairobi",
    location_display: "Nairobi, Kenya",
    mileage: 46100,
    mileage_unit: "km",
    transmission: "Automatic (9G-TRONIC)",
    fuel_type: "Petrol Hybrid (EQ Boost)",
    body_type: "Sedan",
    color: "Obsidian Black Metallic",
    engine_size: "1500cc Turbo + 48V Hybrid",
    condition: "Foreign Used - Grade 4.5B",
    description: "Immaculate Mercedes-Benz C200 AMG Line facelift. Digital cockpit instrument cluster, panoramic sliding sunroof, ambient lighting (64 colors), AMG sport flat-bottom steering wheel, Burmester sound, full dealer service record.",
    right_hand_drive: true,
    steering_side: "right",
    available_for_export: true,
    shipping_info: "In yard, ready for viewing and test drive.",
    import_duties_note: "KRA verified. Zero encumbrance.",
    vin: "WDD2050772R189421",
    featured: true,
    views: 980,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    documents_verified: true,
    ntsa_verified: true,
    inspection_verified: true,
    pay_full: true,
    pay_deposit: true,
    pay_installments: true,
    deposit_percent: 20,
    installment_months: 24,
    installment_interest_rate: 11.5,
    installment_monthly: 165000,
    yard_id: "yard-1",
    car_images: [
      {
        image_url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&auto=format&fit=crop&q=80",
        is_primary: true,
        sort_order: 0,
      },
      {
        image_url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80",
        is_primary: false,
        sort_order: 1,
      },
    ],
    car_yards: {
      id: "yard-1",
      slug: "nairobi-hub",
      name: "AutoConnect Nairobi Central Yard",
      logo_url: null,
      city: "Nairobi",
      country: "KE",
      is_approved: true,
    },
    sellers: {
      id: "demo-seller-kenji",
      business_name: "Kenji Auto Export & Direct Motors",
      country: "KE",
      city: "Nairobi",
      location_display: "Nairobi, Kenya",
      is_verified: true,
      verification_badge: true,
      is_dealer: true,
      offers_local_pickup: true,
      offers_domestic_shipping: true,
      offers_international_shipping: true,
    },
  },
  {
    id: "car-4",
    seller_id: "demo-seller-kenji",
    title: "2020 Subaru Outback 2.5i Limited EyeSight",
    make_name: "Subaru",
    model_name: "Outback",
    year: 2020,
    price: 3650000,
    currency: "KES",
    country: "KE",
    city: "Nairobi",
    location_display: "Nairobi, Kenya",
    mileage: 49800,
    mileage_unit: "km",
    transmission: "Lineartronic CVT",
    fuel_type: "Petrol",
    body_type: "Wagon / Crossover",
    color: "Tungsten Metallic",
    engine_size: "2500cc Boxer",
    condition: "Foreign Used - Grade 4.5A",
    description: "Rugged elegance with Subaru Symmetrical All-Wheel Drive and X-MODE with Hill Descent Control. Features EyeSight driver assist technology, Harman Kardon premium sound, dual-zone climate, heated front and rear seats, and 8.7-inch ground clearance perfect for East African roads.",
    right_hand_drive: true,
    steering_side: "right",
    available_for_export: true,
    shipping_info: "In yard, ready for inspection.",
    import_duties_note: "Duty fully cleared.",
    vin: "JF2BS9CL4G0192841",
    featured: true,
    views: 890,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    documents_verified: true,
    ntsa_verified: true,
    inspection_verified: true,
    pay_full: true,
    pay_deposit: true,
    pay_installments: true,
    deposit_percent: 20,
    installment_months: 24,
    installment_interest_rate: 11.5,
    installment_monthly: 138000,
    yard_id: "yard-1",
    car_images: [
      {
        image_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200&auto=format&fit=crop&q=80",
        is_primary: true,
        sort_order: 0,
      },
    ],
    car_yards: {
      id: "yard-1",
      slug: "nairobi-hub",
      name: "AutoConnect Nairobi Central Yard",
      logo_url: null,
      city: "Nairobi",
      country: "KE",
      is_approved: true,
    },
    sellers: {
      id: "demo-seller-kenji",
      business_name: "Kenji Auto Export & Direct Motors",
      country: "KE",
      city: "Nairobi",
      location_display: "Nairobi, Kenya",
      is_verified: true,
      verification_badge: true,
      is_dealer: true,
      offers_local_pickup: true,
      offers_domestic_shipping: true,
      offers_international_shipping: true,
    },
  },
];

export const DEMO_TRANSACTION = {
  id: "tx-1",
  status: "payment_received",
  display_currency: "KES",
  display_car_price: 6850000,
  display_service_fee: 102750,
  display_total: 6952750,
  initiated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  paid_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  released_at: null,
  disputed_at: null,
  buyer_id: "demo-buyer-alice",
  car_id: "car-1",
  payment_method: "mpesa",
  manual_channel: "mpesa",
  manual_reference: "QK879XJ391",
  handover_ready_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  cars: {
    title: "2021 Toyota Land Cruiser Prado TX-L 2.8D",
    year: 2021,
    car_images: [
      {
        image_url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80",
        is_primary: true,
      },
    ],
  },
  sellers: {
    business_name: "Kenji Auto Export & Direct Motors",
    country: "KE",
  },
};
