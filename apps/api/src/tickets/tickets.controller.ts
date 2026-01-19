import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  @Post()
  @Roles('tenant', 'admin_uk', 'manager', 'owner')
  create(@Request() req: any, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(req.user.sub, createTicketDto);
  }

  @Get()
  @Roles('admin_uk', 'manager', 'owner', 'agent', 'service')
  async findAll(@Request() req: any) {
    const userId = req.user.sub;

    // We need to determine the role. 
    // Assuming SupabaseAuthGuard attaches user with app_metadata or we fetch profile. 
    // However, RolesGuard typically checks roles. 
    // Let's assume the user object has the role or we verify.
    // For now, simpler: we check the role from the token/DB or assume it's passed.
    // But req.user usually comes from supabase.auth.getUser() equivalent token.
    // Let's rely on fetching the profile role if not present, OR try to deduce.
    // BETTER: The user's role is critical. Let's fetch the profile to be sure, or check app_metadata.
    // Assuming app_metadata has 'role' or 'app_role'.
    // If not, we'll default to manager behavior if admin, owner behavior if owner, etc.

    // NOTE: The RolesGuard verifies they HAVE access. Now we scope the DATA.
    // We can iterate roles? Or just handle the "highest" role if multiple?
    // Let's fetch the profile to be explicit.

    // Actually, let's try to query public.profiles if we don't have role handy.
    // But simpler: just modify findAll to dispatch.

    // Since we don't have easy role access in req.user standard JWT without custom claims:
    // We will do a quick check via specific service methods or trust a header? No, trust DB.

    // Let's assume the primary role is what we care about.
    // We can try `findForOwner` if they are an owner.
    // But optimization: let's look at `req.user.role` (SB built-in) or `req.user.app_metadata.role`.

    const role = req.user.role || (req.user.app_metadata && req.user.app_metadata.role);
    // SB 'authenticated' role is generic. We need our 'owner', 'manager' etc. 
    // This usually lives in `public.profiles`.

    // Let's use the service to find the role or just use `findMyTickets` equivalent logic?
    // We'll trust the caller's context or fetch usage.

    // HACK: For now, I'll fetch the profile role.
    const profile = await this.ticketsService.getProfile(userId);
    const userRole = profile?.role;

    if (userRole === 'owner') {
      return this.ticketsService.findForOwner(userId);
    } else if (userRole === 'agent' || userRole === 'service') {
      return this.ticketsService.findAssignedTickets(userId);
    } else if (userRole === 'manager' || userRole === 'admin_uk') {
      return this.ticketsService.findAll();
    }

    // Default fallback
    return [];
  }
  @Get('my')
  @Roles('tenant', 'admin_uk', 'manager')
  findMyTickets(@Request() req: any) {
    return this.ticketsService.findMyTickets(req.user.sub);
  }

  @Get(':id')
  @Roles('admin_uk', 'manager', 'tenant', 'owner')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin_uk', 'manager', 'owner', 'agent')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Post(':id/comments')
  @Roles('tenant', 'admin_uk', 'manager', 'owner', 'agent')
  addComment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.ticketsService.addComment(
      id,
      req.user.sub,
      createCommentDto.content,
    );
  }

  @Get(':id/comments')
  @Roles('tenant', 'admin_uk', 'manager', 'owner', 'agent')
  getComments(@Param('id') id: string) {
    return this.ticketsService.getComments(id);
  }
}
