import { Injectable } from '@nestjs/common';
import { CefrLevel } from '@prisma/client';

export interface ScoreResult {
  totalPoints: number;
  earnedPoints: number;
  score: number;
  cefrLevel: CefrLevel;
  passed: boolean;
  breakdown: Record<string, { earned: number; total: number; percentage: number }>;
}

@Injectable()
export class ScoringService {
  /**
   * Determine CEFR level from a percentage score on a test targeting a given level.
   * Adaptive scoring: the final CEFR is calibrated based on target level + performance.
   */
  determineCefrLevel(scorePercentage: number, targetLevel: CefrLevel): CefrLevel {
    const levels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const targetIndex = levels.indexOf(targetLevel);

    if (scorePercentage >= 90) {
      // Exceptional performance — potentially one level above target
      return levels[Math.min(targetIndex + 1, levels.length - 1)];
    } else if (scorePercentage >= 75) {
      return targetLevel;
    } else if (scorePercentage >= 60) {
      return levels[Math.max(targetIndex - 1, 0)];
    } else if (scorePercentage >= 40) {
      return levels[Math.max(targetIndex - 2, 0)];
    } else {
      return levels[Math.max(targetIndex - 3, 0)];
    }
  }

  /**
   * Calculate score from answered questions grouped by type.
   */
  calculateScore(
    answers: Array<{
      isCorrect: boolean | null;
      aiScore: number | null;
      pointsEarned: number | null;
      question: {
        type: string;
        points: number;
        cefrLevel: CefrLevel | null;
      };
    }>,
    targetLevel: CefrLevel,
    passingScore: number,
  ): ScoreResult {
    let totalPoints = 0;
    let earnedPoints = 0;
    const breakdown: Record<string, { earned: number; total: number; percentage: number }> = {};

    for (const answer of answers) {
      const { question, isCorrect, aiScore, pointsEarned } = answer;
      const type = question.type;

      if (!breakdown[type]) breakdown[type] = { earned: 0, total: 0, percentage: 0 };
      breakdown[type].total += question.points;
      totalPoints += question.points;

      let earned = 0;
      if (pointsEarned !== null) {
        earned = pointsEarned;
      } else if (type === 'SPEAKING' || type === 'WRITING') {
        earned = Math.round(((aiScore ?? 0) / 100) * question.points);
      } else {
        earned = isCorrect ? question.points : 0;
      }

      breakdown[type].earned += earned;
      earnedPoints += earned;
    }

    // Compute percentages
    for (const type of Object.keys(breakdown)) {
      const b = breakdown[type];
      b.percentage = b.total > 0 ? Math.round((b.earned / b.total) * 100) : 0;
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100 * 100) / 100 : 0;
    const cefrLevel = this.determineCefrLevel(score, targetLevel);
    const passed = score >= passingScore;

    return { totalPoints, earnedPoints, score, cefrLevel, passed, breakdown };
  }

  /**
   * Generate CEFR-aligned feedback string.
   */
  generateFeedback(cefrLevel: CefrLevel, languageCode: string): string {
    const descriptions: Record<CefrLevel, string> = {
      A1: 'Can understand and use familiar everyday expressions and very basic phrases.',
      A2: 'Can understand sentences and frequently used expressions related to areas of immediate relevance.',
      B1: 'Can understand the main points of clear standard input on familiar matters regularly encountered.',
      B2: 'Can understand the main ideas of complex text on both concrete and abstract topics.',
      C1: 'Can understand a wide range of demanding, longer texts, and recognise implicit meaning.',
      C2: 'Can understand with ease virtually everything heard or read.',
    };
    return descriptions[cefrLevel] ?? '';
  }
}
