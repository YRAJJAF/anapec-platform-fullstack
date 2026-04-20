import { ScoringService } from '../scoring.service';
import { CefrLevel } from '@prisma/client';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  describe('determineCefrLevel', () => {
    it('should return one level above target on exceptional score (>=90%)', () => {
      expect(service.determineCefrLevel(95, 'A1')).toBe('A2');
      expect(service.determineCefrLevel(92, 'B1')).toBe('B2');
    });

    it('should return target level on good score (75-89%)', () => {
      expect(service.determineCefrLevel(80, 'B1')).toBe('B1');
      expect(service.determineCefrLevel(75, 'A2')).toBe('A2');
    });

    it('should return one level below on passing score (60-74%)', () => {
      expect(service.determineCefrLevel(65, 'B1')).toBe('A2');
      expect(service.determineCefrLevel(60, 'B2')).toBe('B1');
    });

    it('should not go below A1', () => {
      expect(service.determineCefrLevel(10, 'A1')).toBe('A1');
    });

    it('should not exceed C2', () => {
      expect(service.determineCefrLevel(100, 'C2')).toBe('C2');
    });
  });

  describe('calculateScore', () => {
    const makeAnswer = (isCorrect: boolean, points: number, type = 'MULTIPLE_CHOICE') => ({
      isCorrect,
      aiScore: null,
      pointsEarned: isCorrect ? points : 0,
      question: { type, points, cefrLevel: 'A1' as CefrLevel },
    });

    it('should calculate 100% on all correct answers', () => {
      const answers = [makeAnswer(true, 5), makeAnswer(true, 5), makeAnswer(true, 10)];
      const result = service.calculateScore(answers, 'A1', 60);
      expect(result.score).toBe(100);
      expect(result.earnedPoints).toBe(20);
      expect(result.totalPoints).toBe(20);
      expect(result.passed).toBe(true);
    });

    it('should calculate 50% on half correct answers', () => {
      const answers = [makeAnswer(true, 10), makeAnswer(false, 10)];
      const result = service.calculateScore(answers, 'A1', 60);
      expect(result.score).toBe(50);
      expect(result.passed).toBe(false);
    });

    it('should handle AI-scored writing questions', () => {
      const answers = [{
        isCorrect: null,
        aiScore: 80,
        pointsEarned: null,
        question: { type: 'WRITING', points: 20, cefrLevel: 'B1' as CefrLevel },
      }];
      const result = service.calculateScore(answers, 'B1', 60);
      expect(result.earnedPoints).toBe(16); // 80% of 20
      expect(result.score).toBe(80);
    });

    it('should build breakdown by question type', () => {
      const answers = [
        makeAnswer(true, 5, 'MULTIPLE_CHOICE'),
        makeAnswer(false, 5, 'MULTIPLE_CHOICE'),
        makeAnswer(true, 10, 'READING_COMPREHENSION'),
      ];
      const result = service.calculateScore(answers, 'A2', 60);
      expect(result.breakdown['MULTIPLE_CHOICE'].total).toBe(10);
      expect(result.breakdown['MULTIPLE_CHOICE'].earned).toBe(5);
      expect(result.breakdown['READING_COMPREHENSION'].total).toBe(10);
      expect(result.breakdown['READING_COMPREHENSION'].earned).toBe(10);
    });
  });
});
