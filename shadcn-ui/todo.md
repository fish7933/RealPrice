# 운임 관리 시스템 (Freight Management System)

## 완료된 기능 ✅

### 1. 사용자 인증 및 권한 관리
- [x] 3단계 권한 시스템 (Superadmin, Admin, Viewer)
- [x] 로그인/로그아웃 기능
- [x] 사용자 관리 (생성, 수정, 삭제)
- [x] Superadmin 권한 이전 기능

### 2. 기본 데이터 관리
- [x] 철도 대리점 관리
- [x] 트럭 운송사 관리
- [x] 최종목적지 관리

### 3. 운임 데이터 관리
- [x] 해상운임 (Sea Freight) - 다중 옵션 지원
- [x] 대리점별 해상운임 (Agent-Specific Sea Freight)
- [x] D/O(DTHC) 관리 - 대리점 + POL + POD별
- [x] DP 비용 관리 - 출발항별
- [x] 통합 운임 (Combined Freight)
- [x] 철도 운임 (Port to Border)
- [x] 트럭 운임 (Border to Destination)
- [x] 중량할증 규칙 (Weight Surcharge)

### 4. 원가 계산 기능
- [x] 다중 대리점 조합 계산
- [x] 최저가 자동 표시
- [x] 비용 항목별 제외 기능
- [x] 정렬 기능 (대리점, 철도사, 트럭사, 총액)
- [x] 계산 결과 저장 및 불러오기
- [x] 기타비용 입력 기능

### 5. 견적서 기능
- [x] 견적서 작성 (제시운임, 이윤 계산)
- [x] 견적서 목록 관리
- [x] 견적서 삭제 기능

### 6. Audit Log (운임 변경 기록)
- [x] 모든 운임 테이블 변경 자동 기록
- [x] 변경 전/후 값 추적
- [x] 변경자 정보 기록
- [x] 엔티티별 변경 이력 조회

### 7. 타임머신 기능
- [x] 과거 특정 날짜의 운임 데이터로 계산
- [x] Audit Log 기반 데이터 재구성
- [x] 달력 인터페이스로 날짜 선택
- [x] 운임 변경 내역 표시
- [x] 과거 운임 계산 결과 저장

### 8. 운임 유효기간 관리 (Validity Period) ✨ NEW
- [x] 모든 운임 테이블에 유효기간 추가 (validFrom, validTo)
- [x] 기본값: 당일 ~ 1개월 후
- [x] 유효기간 헬퍼 함수 구현
- [x] 초기 데이터에 유효기간 적용

## 진행 중인 작업 🚧

### 운임 유효기간 UI 구현
- [ ] 운임 테이블에 유효기간 컬럼 추가
- [ ] 유효기간 입력 UI (날짜 선택기)
- [ ] 유효기간 상태 표시 (유효, 만료임박, 만료, 예정)
- [ ] 만료된 운임 필터링 옵션
- [ ] 계산 시 유효한 운임만 사용

## 다음 단계 📋

### 1. 운임 유효기간 완전 통합
- [ ] FreightContext에 유효기간 검증 로직 추가
- [ ] 계산기에서 특정 날짜의 유효한 운임만 조회
- [ ] 관리자 대시보드에 만료 예정 운임 알림
- [ ] 유효기간 일괄 연장 기능

### 2. 데이터 내보내기/가져오기
- [ ] Excel 형식으로 운임 데이터 내보내기
- [ ] Excel 파일에서 운임 데이터 가져오기
- [ ] 템플릿 다운로드 기능

### 3. 대시보드 개선
- [ ] 운임 변동 추이 그래프
- [ ] 대리점별 비용 비교 차트
- [ ] 최근 계산 기록 요약

### 4. 알림 시스템
- [ ] 운임 만료 예정 알림
- [ ] 중요 변경사항 알림
- [ ] 이메일 알림 (선택사항)

## 기술 스택
- React + TypeScript
- Tailwind CSS
- Shadcn UI
- Context API for state management
- LocalStorage for data persistence

## 파일 구조
```
src/
├── components/
│   ├── admin/              # 관리자 대시보드 컴포넌트
│   ├── calculator/         # 원가 계산기 컴포넌트
│   └── ui/                 # 공통 UI 컴포넌트
├── contexts/
│   ├── AuthContext.tsx     # 인증 컨텍스트
│   └── FreightContext.tsx  # 운임 데이터 컨텍스트
├── types/
│   └── freight.ts          # 타입 정의
├── data/
│   └── initialData.ts      # 초기 데이터
├── utils/
│   └── validityHelper.ts   # 유효기간 헬퍼 함수
└── pages/
    ├── LoginPage.tsx       # 로그인 페이지
    ├── DashboardPage.tsx   # 대시보드
    └── CalculatorPage.tsx  # 계산기 페이지
```