import type { MobilePhone } from '../types/mobilemandi';

export function WhatMobileSpecsSheet({ phone }: { phone: MobilePhone }) {
  const specs = phone.specs ?? {} as MobilePhone['specs'];

  const rows = [
    ['Display', specs.display || '—'],
    ['Processor', specs.processor || '—'],
    ['Rear Camera', specs.rearCamera || specs.camera_main || '—'],
    ['Front Camera', specs.frontCamera || '—'],
    ['Battery', specs.battery || '—'],
    ['Charging', specs.charging || '—'],
    ['OS', specs.os || '—'],
    ['Network', specs.network || '—'],
  ];

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-white uppercase tracking-wider">Technical Specifications</div>
      <div className="bg-[#0B101D] border border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          {rows.map(([label, value]) => (
            <div key={label} className="p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
              <div className="mt-1 text-sm text-slate-100 font-medium">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
