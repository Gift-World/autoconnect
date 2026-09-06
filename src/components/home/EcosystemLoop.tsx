import { ArrowRight, Search, ShieldCheck, CreditCard, Car, Wrench } from "lucide-react";

export function EcosystemLoop() {
  const steps = [
    {
      icon: <Search className="h-6 w-6 text-teal-600" />,
      title: "Discover",
      desc: "Find certified local and Japanese import inventory.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-teal-600" />,
      title: "Verify",
      desc: "Every vehicle is backed by a 42-point inspection passport.",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-teal-600" />,
      title: "Buy",
      desc: "Secure escrow payments release funds only upon handover.",
    },
    {
      icon: <Car className="h-6 w-6 text-teal-600" />,
      title: "Own",
      desc: "Manage your vehicle documents and history in one place.",
    },
    {
      icon: <Wrench className="h-6 w-6 text-teal-600" />,
      title: "Service",
      desc: "Book maintenance and order parts straight from your garage.",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            The Complete Automotive Ecosystem
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            AutoConnect isn't just a marketplace. It's the operating system for your entire vehicle journey.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center bg-white p-4 rounded-2xl">
                <div className="h-16 w-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-white shadow-sm border border-teal-100">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
