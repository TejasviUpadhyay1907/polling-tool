import { useState } from "react";
import QRCode from "react-qr-code";
import { Copy, Check, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { shareUrl } from "../../utils/format";

export function SharePanel({ pollId }: { pollId: string }) {
  const url = shareUrl(pollId);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Vote on PulseP", url }); }
      catch { /* dismissed */ }
    } else copy();
  };

  return (
    <div className="bg-surface border border-line rounded-[14px] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <p className="eyebrow"><span className="eyebrow-dot" /> Share this poll</p>
      </div>

      {/* URL row */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 flex items-center rounded-[9px] bg-raised border border-line px-3 py-2">
          <span className="truncate text-[11px] font-mono text-muted">{url}</span>
        </div>
        <Button size="sm" variant="primary" onClick={copy} aria-label="Copy link" className="flex-shrink-0">
          {copied ? <Check className="h-[13px] w-[13px]" /> : <Copy className="h-[13px] w-[13px]" />}
          <span className="hidden sm:inline text-[11px]">{copied ? "Copied" : "Copy"}</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={nativeShare} aria-label="Share" className="flex-shrink-0">
          <Share2 className="h-[13px] w-[13px]" />
        </Button>
      </div>

      {/* QR */}
      <div className="mt-5 flex flex-col items-center">
        <div className="rounded-[12px] border border-line bg-white p-3.5 shadow-card w-fit">
          <QRCode value={url} size={130} viewBox="0 0 256 256" />
        </div>
        <p className="text-[10px] text-subtle mt-2.5 text-center">
          Scan to vote · perfect for classrooms &amp; events
        </p>
      </div>
    </div>
  );
}
