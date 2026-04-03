import Link from 'next/link';

export default function Home() {
  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center font-sans">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
          <span className="bg-[#00E5FF] w-3 h-12 block"></span>
          SSTV Election Engine
        </h1>
        <p className="text-zinc-500 font-bold mt-2 uppercase tracking-widest text-sm">Local Council & Referendum 2026</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-6">
        <Link href="/admin" className="group p-8 bg-zinc-900 border-2 border-zinc-800 rounded-3xl hover:border-[#00E5FF] transition-all">
          <h2 className="text-2xl font-black text-[#00E5FF] mb-2 uppercase">Admin Console</h2>
          <p className="text-zinc-400 text-sm">Data entry, candidate selection, and live push controls.</p>
        </Link>

        <Link href="/mayor" className="group p-8 bg-zinc-900 border-2 border-zinc-800 rounded-3xl hover:border-[#A020F0] transition-all">
          <h2 className="text-2xl font-black text-[#A020F0] mb-2 uppercase">TV Output</h2>
          <p className="text-zinc-400 text-sm">Full-screen 16:9 broadcast graphics for Mayoral results.</p>
        </Link>
        <Link href="/mayor" className="group p-8 bg-zinc-900 border-2 border-zinc-800 rounded-3xl hover:border-[#f05420] transition-all">
          <h2 className="text-2xl font-black text-[#f05420] mb-2 uppercase">TV Output - LowerThird</h2>
          <p className="text-zinc-400 text-sm">Lowerthird broadcast graphics for Mayoral results.</p>
        </Link>
      </div>
      <div className="mt-12 text-[10px] text-zinc-700 font-mono uppercase">
        Connected to Local MongoDB: mongodb://localhost:27017
      </div>
    </div>
  );
}