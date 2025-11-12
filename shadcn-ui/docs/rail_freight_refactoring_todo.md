# 철도 운임 동적 구조 리팩토링 계획

## 목표
철도 운임(PortBorderFreight)을 하드코딩된 4개 중국항 구조에서 완전히 동적인 구조로 변경

## Phase 1: 데이터 구조 재설계 ✅

### 1.1 타입 정의 변경
- [x] `PortBorderFreight` 인터페이스를 POD별 개별 레코드로 변경
  - 기존: `{ agent, qingdao, tianjin, lianyungang, dandong }`
  - 신규: `{ agent, pod, rate }` (각 POD마다 별도 레코드)

### 1.2 FreightContextType 인터페이스 업데이트
- [x] `getPortBorderRate` 함수 추가: (agent, pod, date?) => number

## Phase 2: Supabase 테이블 마이그레이션 ✅

### 2.1 새 테이블 구조 생성
- [x] SQL 스크립트 작성: 새로운 `port_border_freights` 테이블
- [x] 기존 데이터 마이그레이션 스크립트 작성

### 2.2 테이블 실행
- [ ] Supabase에서 마이그레이션 실행

## Phase 3: Context 로직 수정

### 3.1 FreightContext 함수 업데이트
- [ ] `loadPortBorderFreights`: 새 구조로 데이터 로드
- [ ] `addPortBorderFreight`: 단일 POD 레코드 추가
- [ ] `updatePortBorderFreight`: 단일 POD 레코드 수정
- [ ] `deletePortBorderFreight`: 단일 POD 레코드 삭제
- [ ] `getPortBorderRate`: 새 함수 추가 (agent + pod로 조회)

### 3.2 계산 로직 수정
- [ ] `calculateCost` 함수에서 하드코딩된 `podColumnMap` 제거
- [ ] 동적으로 `getPortBorderRate(agent, pod)` 호출로 변경

## Phase 4: UI 컴포넌트 재작성

### 4.1 PortBorderTable 컴포넌트
- [ ] 테이블 구조를 동적 컬럼으로 변경
- [ ] POD 목록을 `ports` 배열에서 필터링 (type === 'POD')
- [ ] 각 대리점별로 모든 POD에 대한 운임 표시
- [ ] 추가/수정 폼을 POD 선택 기반으로 변경

### 4.2 폼 입력 변경
- [ ] POD 선택 드롭다운 추가
- [ ] 단일 운임 입력 필드로 변경

## Phase 5: 테스트 및 검증

### 5.1 기능 테스트
- [ ] 철도 운임 추가 테스트
- [ ] 철도 운임 수정 테스트
- [ ] 철도 운임 삭제 테스트
- [ ] 버전 변경 기능 테스트

### 5.2 계산 로직 테스트
- [ ] 원가 계산기에서 철도 운임 정상 조회 확인
- [ ] 다양한 POD 조합으로 계산 테스트

### 5.3 Lint 및 빌드
- [ ] `pnpm run lint` 통과
- [ ] `pnpm run build` 성공

## 주요 변경 파일 목록

1. `/workspace/shadcn-ui/src/types/freight.ts` - 타입 정의
2. `/workspace/shadcn-ui/src/contexts/FreightContext.tsx` - Context 로직
3. `/workspace/shadcn-ui/src/components/freight/PortBorderTable.tsx` - UI 컴포넌트
4. `/workspace/shadcn-ui/supabase/migrations/` - 데이터베이스 마이그레이션

## 예상 소요 시간
- Phase 1-2: 완료
- Phase 3: 30분
- Phase 4: 45분
- Phase 5: 15분
- **총 예상 시간: 약 1.5시간**