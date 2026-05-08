import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { AudioFormat } from './dto';

export interface SynthesizeOptions {
  text: string;
  voice: string;
  format: AudioFormat;
  rate?: number;
  pitch?: number;
  volume?: number;
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private voicesCache: any[] | null = null;
  private voicesCacheAt = 0;
  private readonly VOICES_TTL_MS = 60 * 60 * 1000;

  formatToOutput(format: AudioFormat): { output: OUTPUT_FORMAT; mime: string; ext: string } {
    switch (format) {
      case 'mp3':
        return { output: OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, mime: 'audio/mpeg', ext: 'mp3' };
      case 'opus':
        return { output: OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS, mime: 'audio/webm', ext: 'webm' };
    }
  }

  async listVoices(localeFilter?: string) {
    const now = Date.now();
    if (!this.voicesCache || now - this.voicesCacheAt > this.VOICES_TTL_MS) {
      const tts = new MsEdgeTTS();
      try {
        this.voicesCache = await tts.getVoices();
        this.voicesCacheAt = now;
      } catch (e: any) {
        this.logger.error(`Failed to fetch voices: ${e?.message}`);
        throw new InternalServerErrorException('Failed to fetch voices from Edge TTS');
      }
    }
    let voices = this.voicesCache!;
    if (localeFilter) {
      const f = localeFilter.toLowerCase();
      voices = voices.filter(
        (v) => v.Locale?.toLowerCase().startsWith(f) || v.ShortName?.toLowerCase().startsWith(f),
      );
    }
    return voices;
  }

  async synthesize(opts: SynthesizeOptions): Promise<Buffer> {
    const { output } = this.formatToOutput(opts.format);
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(opts.voice, output);
    } catch (e: any) {
      this.logger.error(`setMetadata failed: ${e?.message}`);
      throw new BadRequestException(`Invalid voice '${opts.voice}'. Use GET /tts/voices to see available voices.`);
    }

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const prosody: any = {};
        if (opts.rate !== undefined) prosody.rate = opts.rate;
        if (opts.pitch !== undefined) prosody.pitch = `${Math.round((opts.pitch - 1) * 100)}%`;
        if (opts.volume !== undefined) prosody.volume = `${Math.round((opts.volume - 1) * 100)}%`;
        const { audioStream } = tts.toStream(opts.text, Object.keys(prosody).length ? prosody : undefined);
        const chunks: Buffer[] = [];
        audioStream.on('data', (c: Buffer) => chunks.push(c));
        audioStream.on('end', () => {
          try { tts.close(); } catch {}
          resolve(Buffer.concat(chunks));
        });
        audioStream.on('error', (err: Error) => {
          this.logger.error(`Stream error: ${err.message}`);
          try { tts.close(); } catch {}
          reject(new InternalServerErrorException('TTS synthesis failed'));
        });
      } catch (e: any) {
        this.logger.error(`Synthesis exception: ${e?.message}`);
        reject(new InternalServerErrorException('TTS synthesis failed'));
      }
    });
  }
}
