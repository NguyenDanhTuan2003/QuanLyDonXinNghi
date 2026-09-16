import { IsFutureDate } from '@app/commons/decorators/is-future-date.decorator';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsFutureDate({ message: 'Ngày bắt đầu không hợp lệ' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsNotEmpty()
  @IsFutureDate({ message: 'Ngày kết thúc không hợp lệ' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
