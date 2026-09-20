import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const POPULAR_SEARCHES = [
  "Toyota Harrier",
  "Land Cruiser Prado",
  "Mazda CX-5",
  "Subaru Forester",
  "BMW X5",
];

export function LiveMarketplace() {
  const navigate = useNavigate();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [price, setPrice] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/cars",
      search: {
        ...(make ? { make } : {}),
        ...(price ? { max_price: Number(price) } : {}),
      } as never,
    });
  };

  return (
    <section className="bg-white dark:bg-slate-950 py-16 sm:py-24 border-b border-slate-100 dark:border-slate-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            What are you looking for?
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Search by make, model, or body type...
          </p>

          <form onSubmit={handleSearch} className="mt-10 max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl sm:rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            
            <div className="flex-1 w-full flex items-center px-4 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 py-2 sm:py-0">
              <Search className="h-5 w-5 text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Make (e.g. Toyota)"
                className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
            </div>
            
            <div className="flex-1 w-full flex items-center px-4 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 py-2 sm:py-0">
              <input
                type="text"
                placeholder="Model (e.g. Harrier)"
                className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>

            <div className="flex-1 w-full flex items-center px-4 py-2 sm:py-0">
              <select 
                className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 appearance-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              >
                <option value="">Any price</option>
                <option value="2000000">Under KSh 2,000,000</option>
                <option value="4000000">Under KSh 4,000,000</option>
                <option value="7000000">Under KSh 7,000,000</option>
                <option value="10000000">Under KSh 10,000,000</option>
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <Button type="submit" className="w-full sm:w-auto rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                Search <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <span className="text-slate-500">Popular searches:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  to="/cars"
                  search={{ q: term } as never}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
