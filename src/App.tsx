import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function App() {
  return (
    <main
      id="main-container"
      className="min-h-screen w-full bg-[#faf9f6] text-[#1a1918] flex items-center justify-center p-6 sm:p-12 font-sans antialiased selection:bg-neutral-200"
    >
      <motion.div
        id="greeting-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-white border border-[#e5e4df] rounded-2xl p-8 sm:p-10 shadow-xs text-center"
      >
        <div
          id="greeting-badge"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4f3ee] text-[#55534e] text-xs font-medium tracking-wide mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2c2b29]" />
          <span>Ready to build</span>
        </div>

        <h1
          id="greeting-title"
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1a1918] mb-3"
        >
          Hello, World!
        </h1>

        <p
          id="greeting-description"
          className="text-[#686660] text-base leading-relaxed max-w-sm mx-auto"
        >
          Your project workspace is initialized and ready. What would you like to create today?
        </p>
      </motion.div>
    </main>
  );
}
