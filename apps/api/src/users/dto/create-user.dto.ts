import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsIn,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['admin', 'admin_uk', 'manager', 'owner', 'tenant', 'agent', 'service'])
  role: string;
}
