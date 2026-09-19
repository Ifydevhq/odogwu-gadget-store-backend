import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsNotEmpty } from 'class-validator';

export class RegisterPushTokenDto {
  @ApiProperty({ description: 'FCM device registration token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ enum: ['android', 'ios', 'web'] })
  @IsIn(['android', 'ios', 'web'])
  platform: 'android' | 'ios' | 'web';
}

export class RemovePushTokenDto {
  @ApiProperty({ description: 'FCM device registration token to remove' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
