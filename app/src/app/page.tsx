"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type BiometricMethod = "face" | "touch";
type BiometricStatus = "idle" | "processing" | "success" | "error";

type RedemptionSuccess = {
  amount: number;
  code: string;
  timestamp: Date;
};

type HistoryItem = {
  id: number;
  code: string;
  amount: number;
  timestamp: Date;
};

const CODE_PATTERN = /^[A-Z0-9]{12}$/;

const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 1,
    code: "Q9TM8H4W2ZL5",
    amount: 12.5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    id: 2,
    code: "BNCE3PACK888",
    amount: 48.2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 3,
    code: "HNY24GIFT777",
    amount: 20.0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36),
  },
];

function formatValidationMessage(value: string) {
  if (value.length === 0) return "Enter the 12-character redemption code.";
  if (!/^[A-Z0-9]*$/.test(value)) {
    return "Use uppercase letters A-Z and numbers only.";
  }
  if (value.length < 12) {
    return `${12 - value.length} more character${value.length === 11 ? "" : "s"} required.`;
  }
  if (!CODE_PATTERN.test(value)) {
    return "Check the code format and try again.";
  }
  return "";
}

function Confetti({ active }: { active: boolean }) {
  const [confettiPieces] = useState(() =>
    Array.from({ length: 26 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 3 + Math.random() * 2,
      color: ["#fcd535", "#f2c500", "#ffe26a", "#ffffff", "#ffaf45"][
        Math.floor(Math.random() * 5)
      ],
      rotation: Math.random() > 0.5 ? 180 : 45,
    }))
  );

  if (!active) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {confettiPieces.map((piece, idx) => (
        <span
          key={idx}
          className="confetti"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDuration: `${piece.duration}s`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
            "--confetti-x": `calc(${piece.left}% - 50%)`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>("idle");
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [biometricMethod, setBiometricMethod] = useState<BiometricMethod>("face");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [success, setSuccess] = useState<RedemptionSuccess | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const confirmationRef = useRef<HTMLDivElement | null>(null);

  const formattedCode = useMemo(
    () => code.toUpperCase().replace(/[^A-Z0-9]/g, ""),
    [code]
  );

  const codeIsValid = CODE_PATTERN.test(formattedCode);
  const validationMessage = formatValidationMessage(formattedCode);
  const helperText = codeTouched
    ? validationMessage.length > 0
      ? validationMessage
      : "Code looks perfect."
    : "Codes are case-sensitive and valid for 24 hours.";
  const biometricReady = biometricStatus === "success";

  useEffect(() => {
    if (success && confirmationRef.current) {
      confirmationRef.current.focus({ preventScroll: false });
    }
  }, [success]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    []
  );

  function handleBiometricAuth(method: BiometricMethod) {
    setBiometricMethod(method);
    setBiometricStatus("processing");
    setBiometricError(null);

    window.setTimeout(() => {
      const succeeded = Math.random() > 0.08;
      if (succeeded) {
        setBiometricStatus("success");
        setBiometricError(null);
      } else {
        setBiometricStatus("error");
        setBiometricError(
          method === "face"
            ? "Face ID match failed. Try again or switch authentication method."
            : "Fingerprint not recognized. Try again or use Face ID."
        );
      }
    }, 900);
  }

  function handleCodeChange(nextValue: string) {
    setCode(nextValue);
    if (!codeTouched) {
      setCodeTouched(true);
    }
  }

  async function handleRedeem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeTouched(true);

    if (!codeIsValid || !biometricReady || redeeming) {
      return;
    }

    setRedeeming(true);
    setShowCelebration(false);

    await new Promise((resolve) => window.setTimeout(resolve, 1150));

    const amount = Number((8 + Math.random() * 92).toFixed(2));
    const redemption: RedemptionSuccess = {
      amount,
      code: formattedCode,
      timestamp: new Date(),
    };

    setSuccess(redemption);
    setHistory((prev) => [
      {
        id: prev.length + 1,
        amount,
        code: formattedCode,
        timestamp: redemption.timestamp,
      },
      ...prev,
    ]);
    setCode("");
    setCodeTouched(false);
    setRedeeming(false);
    setShowCelebration(true);
    setConfettiKey((prevKey) => prevKey + 1);

    window.setTimeout(() => {
      setShowCelebration(false);
    }, 4200);
  }

  return (
    <div className="relative flex min-h-screen justify-center px-4 py-12 sm:px-6">
      <Confetti key={confettiKey} active={showCelebration} />
      <main className="relative z-10 flex w-full max-w-lg flex-col gap-8 text-white">
        <header className="space-y-4 text-center sm:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white/70">
            Binance Red Packet
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Claim your Binance reward in seconds
            </h1>
            <p className="text-sm text-white/70 sm:text-base">
              Redeem Telegram red packets with biometric security and instant
              confirmation. Optimized for mobile with full accessibility support.
            </p>
          </div>
        </header>

        <section className="card-surface flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Biometric access</h2>
              <p className="text-sm text-white/60">
                Authenticate to unlock redemption.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                biometricStatus === "success"
                  ? "bg-[color:var(--binance-yellow)] text-black"
                  : biometricStatus === "processing"
                    ? "bg-white/10 text-white/80"
                    : biometricStatus === "error"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-white/10 text-white/70"
              }`}
              aria-live="polite"
            >
              {biometricStatus === "success" && "Verified"}
              {biometricStatus === "processing" && "Verifying…"}
              {biometricStatus === "error" && "Failed"}
              {biometricStatus === "idle" && "Locked"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={`focus-ring rounded-2xl border border-white/10 px-4 py-3 text-left text-sm font-medium transition ${
                biometricMethod === "face"
                  ? "bg-white/15 text-white"
                  : "bg-transparent text-white/70 hover:text-white"
              }`}
              onClick={() => handleBiometricAuth("face")}
            >
              <span className="block text-xs uppercase tracking-wide text-white/40">
                Preferred
              </span>
              Face ID
            </button>
            <button
              type="button"
              className={`focus-ring rounded-2xl border border-white/10 px-4 py-3 text-left text-sm font-medium transition ${
                biometricMethod === "touch"
                  ? "bg-white/15 text-white"
                  : "bg-transparent text-white/70 hover:text-white"
              }`}
              onClick={() => handleBiometricAuth("touch")}
            >
              <span className="block text-xs uppercase tracking-wide text-white/40">
                Alternate
              </span>
              Touch ID
            </button>
          </div>

          {biometricError ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {biometricError}
            </p>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              Tap a method to authenticate. We never store biometric data on our
              servers.
            </p>
          )}
        </section>

        <form
          className="card-surface flex flex-col gap-6 p-6 sm:p-8"
          onSubmit={handleRedeem}
        >
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-semibold text-white"
              htmlFor="code"
            >
              Redemption code
            </label>
            <div className="relative flex items-center">
              <input
                id="code"
                name="code"
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                value={formattedCode}
                aria-invalid={!codeIsValid && codeTouched}
                aria-describedby="code-feedback"
                onChange={(event) => handleCodeChange(event.target.value)}
                onBlur={() => setCodeTouched(true)}
                placeholder="Enter 12 characters"
                className="focus-ring w-full rounded-2xl border border-white/12 bg-black/40 px-5 py-4 text-base uppercase tracking-[0.3em] text-white placeholder:text-white/30"
              />
              {codeIsValid ? (
                <span className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-200">
                  ✓
                </span>
              ) : null}
            </div>
            <p
              id="code-feedback"
              role="status"
              className={`text-sm ${
                codeIsValid ? "text-emerald-300" : "text-white/70"
              }`}
            >
              {helperText}
            </p>
          </div>

          <button
            type="submit"
            className={`focus-ring button-primary flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-lg ${
              !codeIsValid || !biometricReady || redeeming
                ? "cursor-not-allowed opacity-70"
                : "hover:bg-[color:var(--binance-yellow-strong)]"
            }`}
            disabled={!codeIsValid || !biometricReady || redeeming}
          >
            {redeeming ? "Processing…" : "Redeem Now"}
          </button>

          <p className="text-xs text-white/60">
            By redeeming you agree to Binance Red Packet terms. Keep your chat
            secure and never share codes publicly.
          </p>
        </form>

        {success ? (
          <section
            ref={confirmationRef}
            tabIndex={-1}
            className="card-surface relative overflow-hidden p-6 focus:outline-none sm:p-8"
            aria-live="polite"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
            <div className="relative space-y-4">
              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                Success
              </span>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                {`+${success.amount.toFixed(2)} USDT`}
              </h2>
              <p className="text-sm text-white/70">
                Your Binance Red Packet is claimed. Funds are instantly credited to
                your spot wallet balance.
              </p>
              <dl className="grid grid-cols-1 gap-4 text-sm text-white/70 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-white/90">Code</dt>
                  <dd className="mt-1 font-mono text-lg tracking-[0.3em] text-white">
                    {success.code}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-white/90">Redeemed</dt>
                  <dd className="mt-1">
                    {dateFormatter.format(success.timestamp)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        ) : null}

        <section className="card-surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Redemption history</h2>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
              Latest first
            </span>
          </div>
          <ul className="mt-6 space-y-4">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-4"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-sm tracking-[0.3em] text-white">
                    {entry.code}
                  </span>
                  <span className="text-xs text-white/60">
                    {dateFormatter.format(entry.timestamp)}
                  </span>
                </div>
                <span className="text-base font-semibold text-[color:var(--binance-yellow)]">
                  {`+${entry.amount.toFixed(2)} USDT`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
