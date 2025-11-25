/**
 * 과거 날짜 기반 운임 추적 테스트 유틸리티
 * 
 * 이 파일은 시스템이 과거 특정 날짜의 운임을 올바르게 추적하고 조회할 수 있는지 테스트합니다.
 */

import { supabase, TABLES } from '@/lib/supabase';
import { isValidOnDate } from '@/contexts/freight/freightHelpers';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  data?: unknown;
}

/**
 * 테스트 1: 특정 날짜에 유효한 해상운임 조회
 */
export async function testSeaFreightByDate(
  pol: string,
  pod: string,
  testDate: string
): Promise<TestResult> {
  console.log(`\n🧪 테스트 1: ${testDate} 날짜의 ${pol} → ${pod} 해상운임 조회`);
  
  try {
    // 모든 해상운임 조회
    const { data: allFreights, error } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .select('*')
      .eq('pol', pol)
      .eq('pod', pod);

    if (error) throw error;

    console.log(`   📦 전체 운임 개수: ${allFreights?.length || 0}`);

    if (!allFreights || allFreights.length === 0) {
      return {
        testName: 'testSeaFreightByDate',
        passed: false,
        details: `${pol} → ${pod} 경로의 운임이 없습니다.`,
      };
    }

    // 테스트 날짜에 유효한 운임 필터링
    const validFreights = allFreights.filter(f => 
      isValidOnDate(f.valid_from, f.valid_to, testDate)
    );

    console.log(`   ✅ ${testDate}에 유효한 운임: ${validFreights.length}개`);
    
    validFreights.forEach((f, idx) => {
      console.log(`      ${idx + 1}. Rate: ${f.rate}, Carrier: ${f.carrier}, Valid: ${f.valid_from} ~ ${f.valid_to}`);
    });

    // 현재 날짜에 유효한 운임과 비교
    const currentDate = new Date().toISOString().split('T')[0];
    const currentValidFreights = allFreights.filter(f => 
      isValidOnDate(f.valid_from, f.valid_to, currentDate)
    );

    console.log(`   📅 현재(${currentDate})에 유효한 운임: ${currentValidFreights.length}개`);

    return {
      testName: 'testSeaFreightByDate',
      passed: true,
      details: `${testDate}에 유효한 운임 ${validFreights.length}개 발견 (현재: ${currentValidFreights.length}개)`,
      data: {
        testDate,
        validFreights: validFreights.map(f => ({
          id: f.id,
          rate: f.rate,
          carrier: f.carrier,
          validFrom: f.valid_from,
          validTo: f.valid_to,
        })),
        currentValidFreights: currentValidFreights.map(f => ({
          id: f.id,
          rate: f.rate,
          carrier: f.carrier,
          validFrom: f.valid_from,
          validTo: f.valid_to,
        })),
      },
    };
  } catch (error) {
    console.error('   ❌ 오류:', error);
    return {
      testName: 'testSeaFreightByDate',
      passed: false,
      details: `오류 발생: ${error}`,
    };
  }
}

/**
 * 테스트 2: 해상운임 히스토리 테이블 조회
 */
export async function testSeaFreightHistory(
  freightCode?: string
): Promise<TestResult> {
  console.log(`\n🧪 테스트 2: 해상운임 히스토리 조회${freightCode ? ` (코드: ${freightCode})` : ''}`);
  
  try {
    let query = supabase
      .from(TABLES.SEA_FREIGHT_HISTORY)
      .select('*')
      .order('archived_at', { ascending: false });

    if (freightCode) {
      query = query.eq('freight_code', freightCode);
    } else {
      query = query.limit(10);
    }

    const { data: historyData, error } = await query;

    if (error) throw error;

    console.log(`   📦 히스토리 레코드 개수: ${historyData?.length || 0}`);

    if (historyData && historyData.length > 0) {
      historyData.forEach((h, idx) => {
        console.log(`      ${idx + 1}. Code: ${h.freight_code}`);
        console.log(`         Rate: ${h.rate}, Carrier: ${h.carrier}`);
        console.log(`         Valid: ${h.valid_from} ~ ${h.valid_to}`);
        console.log(`         Archived: ${h.archived_at} by ${h.archived_by_username}`);
      });
    }

    return {
      testName: 'testSeaFreightHistory',
      passed: true,
      details: `히스토리 레코드 ${historyData?.length || 0}개 발견`,
      data: historyData,
    };
  } catch (error) {
    console.error('   ❌ 오류:', error);
    return {
      testName: 'testSeaFreightHistory',
      passed: false,
      details: `오류 발생: ${error}`,
    };
  }
}

/**
 * 테스트 3: 특정 날짜의 운임으로 원가 계산 시뮬레이션
 */
export async function testCostCalculationWithDate(
  pol: string,
  pod: string,
  testDate: string
): Promise<TestResult> {
  console.log(`\n🧪 테스트 3: ${testDate} 날짜 기준 원가 계산 시뮬레이션`);
  
  try {
    // 1. 해상운임 조회
    const { data: seaFreights, error: seaError } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .select('*')
      .eq('pol', pol)
      .eq('pod', pod);

    if (seaError) throw seaError;

    const validSeaFreights = seaFreights?.filter(f => 
      isValidOnDate(f.valid_from, f.valid_to, testDate)
    ) || [];

    console.log(`   📦 ${testDate}에 유효한 해상운임: ${validSeaFreights.length}개`);

    // 2. 대리점 해상운임 조회 (예: FESCO)
    const { data: agentFreights, error: agentError } = await supabase
      .from(TABLES.AGENT_SEA_FREIGHTS)
      .select('*')
      .eq('pol', pol)
      .eq('pod', pod);

    if (agentError) throw agentError;

    const validAgentFreights = agentFreights?.filter(f => 
      isValidOnDate(f.valid_from, f.valid_to, testDate)
    ) || [];

    console.log(`   📦 ${testDate}에 유효한 대리점 해상운임: ${validAgentFreights.length}개`);
    validAgentFreights.forEach((f, idx) => {
      console.log(`      ${idx + 1}. Agent: ${f.agent}, Rate: ${f.rate}, Valid: ${f.valid_from} ~ ${f.valid_to}`);
    });

    // 3. 철도운임 조회
    const { data: railFreights, error: railError } = await supabase
      .from(TABLES.PORT_BORDER_FREIGHTS)
      .select('*')
      .eq('pod', pod);

    if (railError) throw railError;

    const validRailFreights = railFreights?.filter(f => 
      isValidOnDate(f.valid_from, f.valid_to, testDate)
    ) || [];

    console.log(`   📦 ${testDate}에 유효한 철도운임: ${validRailFreights.length}개`);

    // 4. 결과 요약
    const summary = {
      testDate,
      pol,
      pod,
      validSeaFreights: validSeaFreights.length,
      validAgentFreights: validAgentFreights.length,
      validRailFreights: validRailFreights.length,
      seaFreightOptions: validSeaFreights.map(f => ({
        id: f.id,
        rate: f.rate,
        carrier: f.carrier,
      })),
      agentFreightOptions: validAgentFreights.map(f => ({
        agent: f.agent,
        rate: f.rate,
      })),
    };

    console.log(`\n   ✅ 요약:`);
    console.log(`      - 해상운임 옵션: ${summary.validSeaFreights}개`);
    console.log(`      - 대리점 해상운임: ${summary.validAgentFreights}개`);
    console.log(`      - 철도운임: ${summary.validRailFreights}개`);

    return {
      testName: 'testCostCalculationWithDate',
      passed: true,
      details: `${testDate} 기준 운임 조회 성공`,
      data: summary,
    };
  } catch (error) {
    console.error('   ❌ 오류:', error);
    return {
      testName: 'testCostCalculationWithDate',
      passed: false,
      details: `오류 발생: ${error}`,
    };
  }
}

/**
 * 테스트 4: 해상운임 선택 시 과거 날짜 필터링 확인
 */
export async function testSeaFreightSelectionWithDate(
  pol: string,
  pod: string,
  pastDate: string,
  currentDate?: string
): Promise<TestResult> {
  console.log(`\n🧪 테스트 4: 해상운임 선택 시 날짜별 필터링 확인`);
  
  const today = currentDate || new Date().toISOString().split('T')[0];
  
  try {
    const { data: allFreights, error } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .select('*')
      .eq('pol', pol)
      .eq('pod', pod);

    if (error) throw error;

    if (!allFreights || allFreights.length === 0) {
      return {
        testName: 'testSeaFreightSelectionWithDate',
        passed: false,
        details: `${pol} → ${pod} 경로의 운임이 없습니다.`,
      };
    }

    // 과거 날짜 기준 필터링
    const pastValidFreights = allFreights.filter(f => 
      isValidOnDate(f.valid_from, f.valid_to, pastDate)
    );

    // 현재 날짜 기준 필터링
    const currentValidFreights = allFreights.filter(f => 
      isValidOnDate(f.valid_from, f.valid_to, today)
    );

    console.log(`\n   📅 과거 날짜 (${pastDate}):`);
    console.log(`      - 유효한 운임: ${pastValidFreights.length}개`);
    pastValidFreights.forEach((f, idx) => {
      console.log(`        ${idx + 1}. ID: ${f.id.substring(0, 8)}, Rate: ${f.rate}, Carrier: ${f.carrier}`);
    });

    console.log(`\n   📅 현재 날짜 (${today}):`);
    console.log(`      - 유효한 운임: ${currentValidFreights.length}개`);
    currentValidFreights.forEach((f, idx) => {
      console.log(`        ${idx + 1}. ID: ${f.id.substring(0, 8)}, Rate: ${f.rate}, Carrier: ${f.carrier}`);
    });

    // 차이점 분석
    const onlyInPast = pastValidFreights.filter(pf => 
      !currentValidFreights.some(cf => cf.id === pf.id)
    );
    const onlyInCurrent = currentValidFreights.filter(cf => 
      !pastValidFreights.some(pf => pf.id === cf.id)
    );

    console.log(`\n   🔍 차이점 분석:`);
    console.log(`      - 과거에만 있는 운임: ${onlyInPast.length}개`);
    console.log(`      - 현재에만 있는 운임: ${onlyInCurrent.length}개`);

    const isProblem = pastValidFreights.length === 0 && currentValidFreights.length > 0;

    return {
      testName: 'testSeaFreightSelectionWithDate',
      passed: !isProblem,
      details: isProblem 
        ? `⚠️ 문제 발견: 과거 날짜에 유효한 운임이 없지만 현재는 ${currentValidFreights.length}개 존재`
        : `정상: 과거 ${pastValidFreights.length}개, 현재 ${currentValidFreights.length}개`,
      data: {
        pastDate,
        currentDate: today,
        pastValidFreights: pastValidFreights.map(f => ({
          id: f.id,
          rate: f.rate,
          carrier: f.carrier,
          validFrom: f.valid_from,
          validTo: f.valid_to,
        })),
        currentValidFreights: currentValidFreights.map(f => ({
          id: f.id,
          rate: f.rate,
          carrier: f.carrier,
          validFrom: f.valid_from,
          validTo: f.valid_to,
        })),
        onlyInPast: onlyInPast.map(f => f.id),
        onlyInCurrent: onlyInCurrent.map(f => f.id),
      },
    };
  } catch (error) {
    console.error('   ❌ 오류:', error);
    return {
      testName: 'testSeaFreightSelectionWithDate',
      passed: false,
      details: `오류 발생: ${error}`,
    };
  }
}

/**
 * 전체 테스트 실행
 */
export async function runAllTests(
  pol: string = '인천',
  pod: string = 'VOSTOCHNY',
  testDate: string = '2024-01-01'
): Promise<TestResult[]> {
  console.log('\n🚀 ===== 과거 날짜 운임 추적 테스트 시작 =====\n');
  console.log(`📍 테스트 경로: ${pol} → ${pod}`);
  console.log(`📅 테스트 날짜: ${testDate}\n`);

  const results: TestResult[] = [];

  // 테스트 1: 특정 날짜 운임 조회
  results.push(await testSeaFreightByDate(pol, pod, testDate));

  // 테스트 2: 히스토리 테이블 조회
  results.push(await testSeaFreightHistory());

  // 테스트 3: 원가 계산 시뮬레이션
  results.push(await testCostCalculationWithDate(pol, pod, testDate));

  // 테스트 4: 날짜별 필터링 확인
  results.push(await testSeaFreightSelectionWithDate(pol, pod, testDate));

  // 결과 요약
  console.log('\n\n📊 ===== 테스트 결과 요약 =====\n');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  results.forEach((result, idx) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} 테스트 ${idx + 1}: ${result.testName}`);
    console.log(`   ${result.details}\n`);
  });

  console.log(`\n총 ${totalCount}개 테스트 중 ${passedCount}개 통과 (${Math.round(passedCount / totalCount * 100)}%)\n`);

  return results;
}

/**
 * 브라우저 콘솔에서 실행하는 방법:
 * 
 * import { runAllTests } from '@/utils/testHistoricalFreight';
 * 
 * // 기본 테스트 (인천 → VOSTOCHNY, 2024-01-01)
 * const results = await runAllTests();
 * 
 * // 커스텀 테스트
 * const results = await runAllTests('인천', 'VOSTOCHNY', '2024-06-01');
 */