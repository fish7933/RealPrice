// Version configuration for the freight management system
export const VERSION_INFO = {
  version: '1.2.0',
  lastUpdate: '2025-01-16',
  updateHistory: [
    {
      version: '1.2.0',
      date: '2025-01-16',
      changes: [
        '해상운임 $0 값 표시 개선 (N/A → $0)',
        '음수 해상운임에 별표 아이콘 표시 기능 추가',
        '운임 계산기 UI 안정성 향상',
      ],
    },
    {
      version: '1.1.0',
      date: '2025-01-15',
      changes: [
        '타임머신 기능 추가 (과거 운임 조회)',
        '제약 없이 보기 기능 추가',
        '운임 조합 필터링 개선',
      ],
    },
    {
      version: '1.0.0',
      date: '2025-01-10',
      changes: [
        '운임 관리 시스템 초기 버전 출시',
        '원가 계산기 기본 기능 구현',
        '대리점별 운임 관리 기능',
      ],
    },
  ],
};

export const getVersionString = () => `v${VERSION_INFO.version}`;
export const getLastUpdateDate = () => VERSION_INFO.lastUpdate;
export const getLatestChanges = () => VERSION_INFO.updateHistory[0].changes;