export function SellYourCarCTA() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            Have a car to sell?
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Put it in front of serious buyers.
          </p>
          <div className="mt-8">
            <a
              href="/seller"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 px-6 py-3 text-sm font-semibold text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 transition-colors"
            >
              List your vehicle →
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 flex items-center gap-4">
                <span className="text-4xl font-light text-slate-300 dark:text-slate-700">01</span> Tell us about it
              </dt>
            </div>
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 flex items-center gap-4">
                <span className="text-4xl font-light text-slate-300 dark:text-slate-700">02</span> Upload your photos
              </dt>
            </div>
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 flex items-center gap-4">
                <span className="text-4xl font-light text-slate-300 dark:text-slate-700">03</span> Verification
              </dt>
            </div>
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 flex items-center gap-4">
                <span className="text-4xl font-light text-slate-300 dark:text-slate-700">04</span> Connect with buyers
              </dt>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
