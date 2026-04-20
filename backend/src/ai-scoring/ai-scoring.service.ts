import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CefrLevel } from '@prisma/client';
import { StorageService } from '../common/storage/storage.service';

export interface SpeakingScore {
  score: number;       // 0-100
  feedback: string;
  transcription: string;
  fluency: number;
  pronunciation: number;
  vocabulary: number;
  grammar: number;
}

export interface WritingScore {
  score: number;
  feedback: string;
  coherence: number;
  vocabulary: number;
  grammar: number;
  taskAchievement: number;
}

@Injectable()
export class AiScoringService {
  private readonly logger = new Logger(AiScoringService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {
    const apiKey = this.config.get<string>('openai.apiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not configured — AI scoring disabled');
    }
  }

  async scoreSpeaking(audioUrl: string, questionPrompt: string): Promise<SpeakingScore> {
    if (!this.openai) return this.mockSpeakingScore();

    try {
      // Download audio from storage
      const audioBuffer = await this.storage.downloadFile(audioUrl);
      const audioFile = new File([audioBuffer as any], 'audio.webm', { type: 'audio/webm' }) as any;

      // Transcribe with Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: this.config.get('openai.whisperModel', 'whisper-1'),
        language: undefined, // auto-detect
      });

      // Score with GPT-4
      const prompt = `You are a CEFR language evaluator. Evaluate this spoken response.

Question/Prompt: "${questionPrompt}"
Transcribed Response: "${transcription.text}"

Evaluate on a scale of 0-100 for each criterion:
- Fluency (smooth delivery, natural pace, minimal hesitation)
- Pronunciation (clarity, accent, phonetic accuracy)
- Vocabulary (range, appropriateness, accuracy)
- Grammar (correctness, complexity, range)

Return ONLY a valid JSON object:
{
  "fluency": <0-100>,
  "pronunciation": <0-100>,
  "vocabulary": <0-100>,
  "grammar": <0-100>,
  "overall": <0-100>,
  "feedback": "<constructive 2-3 sentence feedback in the language of the response>"
}`;

      const completion = await this.openai.chat.completions.create({
        model: this.config.get('openai.model', 'gpt-4o'),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const result = JSON.parse(completion.choices[0].message.content ?? '{}');

      return {
        score: result.overall ?? 50,
        feedback: result.feedback ?? '',
        transcription: transcription.text,
        fluency: result.fluency ?? 50,
        pronunciation: result.pronunciation ?? 50,
        vocabulary: result.vocabulary ?? 50,
        grammar: result.grammar ?? 50,
      };
    } catch (err) {
      this.logger.error('Speaking scoring failed', err);
      return this.mockSpeakingScore();
    }
  }

  async scoreWriting(
    writtenText: string,
    questionPrompt: string,
    targetLevel: CefrLevel,
  ): Promise<WritingScore> {
    if (!this.openai) return this.mockWritingScore();

    try {
      const prompt = `You are a CEFR ${targetLevel} language evaluator for written production.

Task: "${questionPrompt}"
Candidate Response: "${writtenText}"

Evaluate for CEFR ${targetLevel} on a scale of 0-100:
- Task Achievement (addresses the task, appropriate length)
- Coherence (logical flow, paragraphing, cohesive devices)
- Vocabulary (range, precision, appropriateness for level)
- Grammar (accuracy, complexity, range for level)

Return ONLY a valid JSON object:
{
  "taskAchievement": <0-100>,
  "coherence": <0-100>,
  "vocabulary": <0-100>,
  "grammar": <0-100>,
  "overall": <0-100>,
  "feedback": "<constructive 3-4 sentence feedback>"
}`;

      const completion = await this.openai.chat.completions.create({
        model: this.config.get('openai.model', 'gpt-4o'),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const result = JSON.parse(completion.choices[0].message.content ?? '{}');

      return {
        score: result.overall ?? 50,
        feedback: result.feedback ?? '',
        coherence: result.coherence ?? 50,
        vocabulary: result.vocabulary ?? 50,
        grammar: result.grammar ?? 50,
        taskAchievement: result.taskAchievement ?? 50,
      };
    } catch (err) {
      this.logger.error('Writing scoring failed', err);
      return this.mockWritingScore();
    }
  }

  /** Analyse text for CEFR level (used for remediation recommendations) */
  async analyseCefrLevel(text: string, languageCode: string): Promise<{ level: CefrLevel; confidence: number }> {
    if (!this.openai) return { level: 'A2', confidence: 0 };

    const prompt = `Analyse this ${languageCode} text and determine the CEFR level (A1, A2, B1, B2, C1, C2).
Text: "${text.slice(0, 1000)}"
Return ONLY: {"level": "<CEFR>", "confidence": <0-100>}`;

    const completion = await this.openai.chat.completions.create({
      model: this.config.get('openai.model', 'gpt-4o'),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(completion.choices[0].message.content ?? '{}');
    return { level: result.level ?? 'A2', confidence: result.confidence ?? 50 };
  }

  private mockSpeakingScore(): SpeakingScore {
    return { score: 65, feedback: 'AI scoring unavailable — manual review required.', transcription: '', fluency: 65, pronunciation: 65, vocabulary: 65, grammar: 65 };
  }

  private mockWritingScore(): WritingScore {
    return { score: 65, feedback: 'AI scoring unavailable — manual review required.', coherence: 65, vocabulary: 65, grammar: 65, taskAchievement: 65 };
  }
}
