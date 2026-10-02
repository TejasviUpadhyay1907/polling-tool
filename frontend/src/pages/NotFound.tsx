import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";

export function NotFound() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="mx-auto max-w-[560px] px-4 sm:px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* Big 404 */}
          <p className="font-display font-800 text-[96px] sm:text-[120px] tracking-[-6px] leading-none gradient-text select-none mb-2">
            404
          </p>

          <h1 className="font-display font-700 text-[20px] tracking-[-0.5px] text-ink mb-2">
            Page not found
          </h1>
          <p className="text-[13px] text-muted leading-[1.85] max-w-[360px] mx-auto">
            The link may be incorrect, the poll was deleted, or you may have followed an old URL.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/">
              <Button variant="primary" size="lg">
                <Home className="h-4 w-4" /> Go home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary" size="lg">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
          </div>

          {/* Decorative rings */}
          <div className="relative mt-14 h-[160px] pointer-events-none" aria-hidden>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[120px] w-[120px] rounded-full border border-accent/15" />
              <div className="absolute h-[80px] w-[80px] rounded-full border border-accent/25" />
              <div className="absolute h-[40px] w-[40px] rounded-full border border-accent/40" />
              <div className="absolute h-[12px] w-[12px] rounded-full bg-accent opacity-60 animate-pulseDot" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
