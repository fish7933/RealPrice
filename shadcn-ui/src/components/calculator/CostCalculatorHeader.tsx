import { Calculator, Sparkles } from 'lucide-react';

export default function CostCalculatorHeader() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-4 shadow-xl">
      <div className="absolute inset-0 bg-grid-white/10"></div>
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            운임 조회
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
          </h2>
        </div>
        <p className="text-cyan-50 text-sm ml-9">경로와 추가 비용을 입력하여 대리점별 총 운임을 계산하세요</p>
      </div>
    </div>
  );
}