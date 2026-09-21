import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';
// file này dùng để lọc dùng cho tính năng lọc
export class BaseFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
