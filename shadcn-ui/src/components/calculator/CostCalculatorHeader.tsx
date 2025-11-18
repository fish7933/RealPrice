import { Calculator, Sparkles } from 'lucide-react';

export default function CostCalculatorHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-8 shadow-xl">
      <div className="absolute inset-0 bg-grid-white/10"></div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white flex items-center gap-2">
            운임 조회
            <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
          </h2>
        </div>
        <p className="text-cyan-50 text-lg ml-16">경로와 추가 비용을 입력하여 대리점별 총 운임을 계산하세요</p>
      </div>
    </div>
  );
}