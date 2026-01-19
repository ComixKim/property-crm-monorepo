import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log(
      'Auth Debug - Headers:',
      request.headers['authorization'] ? 'Present' : 'Missing',
    );
    if (request.headers['authorization']) {
      const token = request.headers['authorization'].replace('Bearer ', '');
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(atob(parts[0]));
          // const payload = JSON.parse(atob(parts[1])); // Optional: inspect payload
          console.log('Auth Debug - Token Header:', JSON.stringify(header, null, 2));
          console.log('Auth Debug - Algorithm:', header.alg);
        } else {
          console.log('Auth Debug - Invalid Token Format');
        }
      } catch (e) {
        console.log('Auth Debug - Could not parse token header', e);
      }
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.log('Auth Debug - Error:', err);
      console.log('Auth Debug - Info:', info);
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
