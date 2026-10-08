import { ApiProperty } from '@nestjs/swagger';



class FeatureFlagItemDto {

  @ApiProperty({ example: 'meeting.record' })

  key!: string;



  @ApiProperty({ example: 'ضبط جلسه' })

  label!: string;



  @ApiProperty({ example: 'plus', enum: ['free', 'plus', 'pro', 'enterprise'] })

  minTier!: string;



  @ApiProperty({ example: true })

  enabled!: boolean;

}



export class FeatureFlagsResponseDto {

  @ApiProperty({ example: 'plus', enum: ['free', 'plus', 'pro', 'enterprise'] })

  tier!: string;



  @ApiProperty({ type: [String], example: ['meeting.record', 'meeting.transcribe'] })

  enabled!: string[];



  @ApiProperty({ type: [FeatureFlagItemDto] })

  all!: FeatureFlagItemDto[];

}

