import OpenAI, { toFile } from 'openai';
import { Router } from 'express';
import { z } from 'zod';
import { success, error } from '../utils/responseHelpers';

export const transcriptionRoutes = Router();

const TranscribeRequestBody = z.object({
  audioBase64: z.string().min(100, 'Audio recording is too short'),
  mimeType: z.string().min(3).max(80).default('audio/m4a'),
  fileName: z.string().min(3).max(120).default('voice-request.m4a'),
});

transcriptionRoutes.post('/transcribe-request', async (req, res) => {
  try {
    const validation = TranscribeRequestBody.safeParse(req.body);
    if (!validation.success) {
      return error(res, validation.error.errors[0]?.message ?? 'Invalid audio payload', 400);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || process.env.DEMO_MODE === 'true') {
      return error(res, 'Voice transcription requires OPENAI_API_KEY on the backend', 503);
    }

    const { audioBase64, mimeType, fileName } = validation.data;
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const client = new OpenAI({ apiKey });
    const audioFile = await toFile(audioBuffer, fileName, { type: mimeType });

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: process.env.OPENAI_TRANSCRIPTION_MODEL ?? 'gpt-4o-mini-transcribe',
      language: 'en',
    });

    const text = transcription.text.trim();
    if (!text) {
      return error(res, 'No speech was detected. Please try recording again.', 422);
    }

    return success(res, { text });
  } catch (e) {
    console.error('[transcribe-request] Transcription error:', e);
    return error(res, 'Could not transcribe the recording. Please try again.', 500);
  }
});
