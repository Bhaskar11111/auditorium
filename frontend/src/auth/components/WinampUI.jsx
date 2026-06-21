import React from "react";
import Equaliazer from "./Equaliazer";

export const StatusLED = ({ label = "ONLINE", tone = "cyan" }) => {
  const color =
    tone === "green"
      ? "bg-emerald-400 shadow-[0_0_8px_#67e8f9]"
      : "bg-emerald-400 shadow-[0_0_8px_#67e8f9]";

  return (
    <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100 ">
      <span className={`h-2.5 w-2.5 animate-led-blink border border-white/50 ${color}`} />
      <span>{label}</span>
    </div>
  );
};

export const WinampButton = ({ as: Component = "button", children, className = "", ...props }) => (
  <Component
    className={`winamp-button h-10 border px-4 font-mono text-[12px] font-black uppercase tracking-[0.18em] text-cyan-50 transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const WinampInput = ({ label, className = "", ...props }) => (
  <label className="block">
    <span className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300">
      {label}
    </span>
    <input
      className={`winamp-input h-11 w-full border px-3 font-mono text-[15px] text-cyan-50 outline-none placeholder:text-slate-500 focus:text-white ${className}`}
      {...props}
    />
  </label>
);

export const Equalizer = () => {
  const bars = [24, 52, 36, 68, 42, 76, 30, 58, 46, 72, 34, 64, 40, 55, 28, 70];

  return (
    <div className="winamp-eq border px-3 py-2">
      <div className="flex h-14 items-end gap-1.5 overflow-hidden">
        {bars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="eq-bar block w-full min-w-2"
            style={{
              height: `${height}%`,
              animationDelay: `${index * -110}ms`,
              animationDuration: `${720 + (index % 5) * 90}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const WindowButton = ({ label, variant = "default" }) => (
  <span
    aria-label={label}
    className={`grid h-4 w-5 place-items-center border text-[10px] font-black leading-none ${
      variant === "close" ? "winamp-close-button" : "winamp-title-button"
    }`}
  >
    {label}
  </span>
);

// const r=Math.floor(Math.random()*150);
// const g=Math.floor(Math.random()*150);
// const b=Math.floor(Math.random()*150);

// const randomColor=`rgba(${r},${g},${b})`

// console.log(randomColor);

const gradients = [
  "linear-gradient(135deg, #232526, #414345)",
  "linear-gradient(135deg, #141E30, #243B55)",
  "linear-gradient(135deg, #1F1C2C, #928DAB)",
  "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
  "linear-gradient(135deg, #232526, #1c1c1c)",
  "linear-gradient(135deg, #373B44, #4286f4)",
  "linear-gradient(135deg, #2C3E50, #4CA1AF)",
  "linear-gradient(135deg, #434343, #000000)",
];

const randomGradient =
  gradients[Math.floor(Math.random() * gradients.length)];

export const WinampWindow = ({ children, mode = "LOGIN" }) => (
  <main className="winamp-desktop bg-neutral-950 relative min-h-screen overflow-hidden px-4 py-8 text-slate-100">
    <div className="pointer-events-none absolute inset-0 winamp-scanlines" />
    <div className="pointer-events-none absolute inset-0 winamp-screen-glow" />

    <section className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="winamp-window w-full max-w-[440px] border p-1 shadow-2xl">
        <div className="winamp-titlebar flex h-8 items-center justify-between border px-2">
          <div className="flex items-center gap-2">
            <span className="h-[11px] w-[10px] border border-cyan-100/70 bg-purple-500 shadow-[0_0_10px_#B982C2]" />
            <h1 className="font-mono font-thin text-[13px] font-black  tracking-[0.18em] text-cyan-50">
              auditorium
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <WindowButton label="-" />
            <WindowButton label="□" />
            <WindowButton label="×" variant="close" />
          </div>
        </div>

        <div className="winamp-panel border p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between border-b border-black/70 pb-3 shadow-[0_1px_0_rgba(255,255,255,0.16)]">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
                secure shell
              </p>
              <h2 className="mt-1 font-mono text-2xl font-black uppercase cursor-pointer tracking-[0.08em] text-gray-300 ">
                {mode}
              </h2>
            </div>
            <StatusLED />
          </div>

          {children}

          <div className="mt-5">
            <Equalizer />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            <span>Auditorium OS v1.1.0</span>
            <span className="flex items-center gap-2 text-cyan-200">
              <StatusLED label="SYSTEM READY" tone="green" />
            </span>
          </div>
        </div>
      </div>
    </section>
  </main>
);
