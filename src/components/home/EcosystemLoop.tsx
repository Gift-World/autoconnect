export function EcosystemLoop() {
  return (
    <section className="bg-slate-50 dark:bg-slate-900/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            From search to keys.
          </h2>
        </div>

        <div className="mx-auto mt-20 max-w-5xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-4">
            
            <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 pt-8">
              <dt className="text-xl font-medium text-slate-900 dark:text-slate-100">
                <span className="block text-4xl font-light text-slate-300 dark:text-slate-700 mb-4">01</span>
                Find
              </dt>
              <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                <p className="flex-auto">Browse verified vehicles.</p>
              </dd>
            </div>
            
            <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 pt-8">
              <dt className="text-xl font-medium text-slate-900 dark:text-slate-100">
                <span className="block text-4xl font-light text-slate-300 dark:text-slate-700 mb-4">02</span>
                Verify
              </dt>
              <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                <p className="flex-auto">Review inspection, seller and vehicle evidence.</p>
              </dd>
            </div>
            
            <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 pt-8">
              <dt className="text-xl font-medium text-slate-900 dark:text-slate-100">
                <span className="block text-4xl font-light text-slate-300 dark:text-slate-700 mb-4">03</span>
                Reserve
              </dt>
              <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                <p className="flex-auto">Secure your vehicle through the protected payment workflow.</p>
              </dd>
            </div>
            
            <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 pt-8">
              <dt className="text-xl font-medium text-slate-900 dark:text-slate-100">
                <span className="block text-4xl font-light text-slate-300 dark:text-slate-700 mb-4">04</span>
                Drive
              </dt>
              <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                <p className="flex-auto">Complete handover and receive your vehicle record.</p>
              </dd>
            </div>

          </dl>
        </div>
      </div>
    </section>
  );
}
