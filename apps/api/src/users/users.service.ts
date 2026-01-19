import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, fullName, role } = createUserDto;

    // 1. Create User in Supabase Auth
    const { data: authData, error: authError } = await this.supabase
      .getClient()
      .auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email since admin created it
        user_metadata: { full_name: fullName },
      });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      throw new InternalServerErrorException('Failed to create user');
    }

    const userId = authData.user.id;

    // 2. Update Profile with correct Role using Admin access
    // Note: The trigger might have already created a basic profile (role='tenant')
    // We perform an upset/update to ensure the role is correct.
    const { error: profileError } = await this.supabase
      .getClient()
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName,
        role: role,
      });

    if (profileError) {
      // Ideally we might want to rollback the auth user creation here,
      // but for MVP we just throw error.
      throw new InternalServerErrorException(
        `User created but profile update failed: ${profileError.message}`,
      );
    }

    return {
      id: userId,
      email,
      role,
      fullName,
      message: 'User created successfully',
    };
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
