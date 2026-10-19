import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  base?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  founded_year?: number;

  @IsBoolean()
  active: boolean;
}
