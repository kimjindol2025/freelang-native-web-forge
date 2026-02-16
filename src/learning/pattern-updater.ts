/**
 * Phase 7.2: Pattern Learning Engine
 *
 * 사용자 피드백 → 패턴 개선
 * - 신뢰도 업데이트 (approval/rejection)
 * - 패턴 변형 학습 (variations)
 * - 사용 통계 추적
 */

import { AutocompleteItem } from '../engine/autocomplete-db';

export interface LearnedPattern {
  id: string;                                // "sum", "filter", etc
  original: AutocompleteItem;                // 기본 패턴

  // 피드백 통계
  feedback: {
    approved: number;                        // 승인 횟수
    rejected: number;                        // 거부 횟수
    modified: number;                        // 수정 횟수
  };

  // 학습 데이터
  variations: Array<{
    text: string;                            // "배열 합산", "total", "sum all"
    count: number;                           // 사용 횟수
    approved: boolean;                       // 마지막 피드백
  }>;

  // 신뢰도 추적
  confidence_history: Array<{
    date: Date;
    value: number;
    reason: 'init' | 'approval' | 'rejection' | 'modification';
  }>;

  // 메타 정보
  last_feedback: Date | null;
  total_interactions: number;
}

export class PatternUpdater {
  private patterns: Map<string, LearnedPattern> = new Map();

  /**
   * 패턴 초기화
   */
  initializePattern(item: AutocompleteItem): void {
    this.patterns.set(item.id, {
      id: item.id,
      original: item,
      feedback: {
        approved: 0,
        rejected: 0,
        modified: 0,
      },
      variations: item.examples.map(ex => ({
        text: ex,
        count: 0,
        approved: true,
      })),
      confidence_history: [
        {
          date: new Date(),
          value: item.confidence,
          reason: 'init',
        },
      ],
      last_feedback: null,
      total_interactions: 0,
    });
  }

  /**
   * 승인 피드백 처리
   */
  recordApproval(patternId: string, variation?: string): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    // 피드백 기록
    pattern.feedback.approved++;
    pattern.total_interactions++;
    pattern.last_feedback = new Date();

    // 변형 추적
    if (variation && !this.hasVariation(pattern, variation)) {
      pattern.variations.push({
        text: variation,
        count: 1,
        approved: true,
      });
    } else if (variation) {
      const varItem = pattern.variations.find(v => v.text === variation);
      if (varItem) {
        varItem.count++;
        varItem.approved = true;
      }
    }

    // 신뢰도 업데이트 (+2%)
    const newConfidence = Math.min(
      0.98,
      pattern.original.confidence * 1.02
    );
    pattern.original.confidence = newConfidence;

    // 히스토리 기록
    pattern.confidence_history.push({
      date: new Date(),
      value: newConfidence,
      reason: 'approval',
    });
  }

  /**
   * 거부 피드백 처리
   */
  recordRejection(patternId: string, variation?: string): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    // 피드백 기록
    pattern.feedback.rejected++;
    pattern.total_interactions++;
    pattern.last_feedback = new Date();

    // 변형 추적
    if (variation) {
      const varItem = pattern.variations.find(v => v.text === variation);
      if (varItem) {
        varItem.approved = false;
      }
    }

    // 신뢰도 업데이트 (-5%)
    const newConfidence = Math.max(
      0.50,
      pattern.original.confidence * 0.95
    );
    pattern.original.confidence = newConfidence;

    // 히스토리 기록
    pattern.confidence_history.push({
      date: new Date(),
      value: newConfidence,
      reason: 'rejection',
    });
  }

  /**
   * 수정 피드백 처리
   */
  recordModification(
    patternId: string,
    modification: Partial<AutocompleteItem>
  ): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    // 피드백 기록
    pattern.feedback.modified++;
    pattern.total_interactions++;
    pattern.last_feedback = new Date();

    // 패턴 업데이트
    if (modification.description) {
      pattern.original.description = modification.description;
    }
    if (modification.examples) {
      modification.examples.forEach(ex => {
        if (!this.hasVariation(pattern, ex)) {
          pattern.variations.push({
            text: ex,
            count: 1,
            approved: true,
          });
        }
      });
    }

    // 신뢰도 업데이트 (-2%)
    const newConfidence = Math.max(
      0.50,
      pattern.original.confidence * 0.98
    );
    pattern.original.confidence = newConfidence;

    // 히스토리 기록
    pattern.confidence_history.push({
      date: new Date(),
      value: newConfidence,
      reason: 'modification',
    });
  }

  /**
   * 변형 확인
   */
  private hasVariation(pattern: LearnedPattern, text: string): boolean {
    return pattern.variations.some(v => v.text === text);
  }

  /**
   * 패턴 통계
   */
  getStats(patternId: string) {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return null;

    const { approved, rejected, modified } = pattern.feedback;
    const total = pattern.total_interactions;
    const approvalRate = total > 0 ? approved / total : 0;
    const avgConfidence =
      pattern.confidence_history.reduce((sum, h) => sum + h.value, 0) /
      pattern.confidence_history.length;

    return {
      id: patternId,
      total_interactions: total,
      approved,
      rejected,
      modified,
      approval_rate: approvalRate,
      rejection_rate: total > 0 ? rejected / total : 0,
      avg_confidence: avgConfidence,
      current_confidence: pattern.original.confidence,
      variations_count: pattern.variations.length,
      last_feedback: pattern.last_feedback,
    };
  }

  /**
   * 모든 패턴 통계
   */
  getAllStats() {
    const stats = [];
    for (const [id] of this.patterns) {
      const stat = this.getStats(id);
      if (stat) stats.push(stat);
    }
    return stats.sort((a, b) => b.total_interactions - a.total_interactions);
  }

  /**
   * 신뢰도 추이 (일일 평균)
   */
  getTrend(patternId: string, days: number = 7) {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return null;

    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const history = pattern.confidence_history.filter(h => h.date > cutoff && h.reason !== 'init');

    // 일일 평균 계산
    const dailyAvg = new Map<string, number[]>();
    history.forEach(h => {
      const dateKey = h.date.toISOString().split('T')[0];
      if (!dailyAvg.has(dateKey)) {
        dailyAvg.set(dateKey, []);
      }
      dailyAvg.get(dateKey)!.push(h.value);
    });

    const trend = Array.from(dailyAvg.entries())
      .map(([date, values]) => ({
        date,
        avg_confidence: values.reduce((a, b) => a + b) / values.length,
        interactions: values.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return trend;
  }

  /**
   * 변형 분석 (인기 있는 변형)
   */
  getPopularVariations(patternId: string, limit: number = 5) {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return [];

    return pattern.variations
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(v => ({
        text: v.text,
        count: v.count,
        approved: v.approved,
      }));
  }

  /**
   * 학습 점수 계산
   * (승인율 + 신뢰도) / 2
   */
  getLearningScore(patternId: string): number {
    const stat = this.getStats(patternId);
    if (!stat) return 0;

    const normalizedConfidence = stat.current_confidence; // 0.5 ~ 0.98
    const score = (stat.approval_rate + normalizedConfidence) / 2;
    return Math.round(score * 100) / 100;
  }

  /**
   * 개선 필요 패턴 (승인율 < 70%)
   */
  getNeedsImprovement(threshold: number = 0.7): Array<{ id: string; approval_rate: number }> {
    return this.getAllStats()
      .filter(stat => stat.approval_rate < threshold && stat.total_interactions > 0)
      .map(stat => ({
        id: stat.id,
        approval_rate: stat.approval_rate,
      }));
  }

  /**
   * 모든 학습된 패턴 조회
   */
  getAll(): LearnedPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * 패턴 조회
   */
  get(patternId: string): LearnedPattern | null {
    return this.patterns.get(patternId) || null;
  }
}

// 싱글톤 인스턴스
export const patternUpdater = new PatternUpdater();
