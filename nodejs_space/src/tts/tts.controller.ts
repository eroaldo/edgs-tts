import { Body, Controller, Get, Post, Query, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiProduces } from '@nestjs/swagger';
import type { Response } from 'express';
import { TtsService } from './tts.service';
import { SynthesizeDto, VoicesQueryDto } from './dto';

@ApiTags('tts')
@Controller('tts')
export class TtsController {
  constructor(private readonly tts: TtsService) {}

  @Get('voices')
  @ApiOperation({ summary: 'List available Edge TTS voices (optional filter by locale)' })
  @ApiOkResponse({ description: 'Array of voice metadata' })
  async voices(@Query() q: VoicesQueryDto) {
    const voices = await this.tts.listVoices(q.locale);
    return { count: voices.length, voices };
  }

  @Post('synthesize')
  @HttpCode(200)
  @ApiOperation({ summary: 'Synthesize text to speech, returns audio binary' })
  @ApiProduces('audio/mpeg', 'audio/webm')
  async synthesize(@Body() body: SynthesizeDto, @Res() res: Response) {
    const voice = body.voice || 'pt-BR-FranciscaNeural';
    const format = body.format || 'mp3';
    const { mime, ext } = this.tts.formatToOutput(format);
    const audio = await this.tts.synthesize({
      text: body.text,
      voice,
      format,
      rate: body.rate,
      pitch: body.pitch,
      volume: body.volume,
    });
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="speech.${ext}"`);
    res.setHeader('Content-Length', audio.length.toString());
    res.end(audio);
  }
}
