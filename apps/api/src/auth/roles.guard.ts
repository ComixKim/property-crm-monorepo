import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Populated by Passport

    if (!user || !user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Fetch user profile from Supabase to check role
    console.log('RolesGuard - Checking User:', user.sub);
    const { data: profile, error } = await this.supabase
      .getClient()
      .from('profiles')
      .select('role')
      .eq('id', user.sub)
      .single();

    if (error || !profile) {
      console.log('RolesGuard - Profile Fetch Failed:', error || 'No Profile');
      throw new ForbiddenException(
        'User profile not found. Please run the setup SQL script.',
      );
    }

    console.log('RolesGuard - User Role:', profile.role);
    console.log('RolesGuard - Required:', requiredRoles);

    if (!requiredRoles.includes(profile.role)) {
      throw new ForbiddenException(
        `Access denied. You have role '${profile.role}', but need one of: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
