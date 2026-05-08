import { Module } from '@nestjs/common';
import { TtsModule } from './tts/tts.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TtsModule],
  controllers: [HealthController],
})
export class AppModule {}
