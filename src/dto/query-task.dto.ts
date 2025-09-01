import { IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { TaskStatus } from '../schemas/task.schema';

export class QueryTaskDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  page_size?: string;
}
