import { Calculator } from 'lucide-react';

export default function CostCalculatorHeader() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-200 p-4 shadow-xl">
      <div className="absolute inset-0 bg-grid-white/5"></div>
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
            <Calculator className="h-5 w-5 text-gray-900" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            운임 조회
          </h2>
        </div>
        <p className="text-gray-600 text-sm ml-9">경로와 추가 비용을 입력하여 대리점별 총 운임을 계산하세요</p>
      </div>
    </div>
  );
}