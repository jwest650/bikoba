import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, SellerApplicationStatus } from '@prisma/client';
import type { SellerApplication } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { SellerApplicationsService } from './seller-applications.service';

@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/seller-applications')
export class AdminSellerApplicationsController {
  constructor(private readonly applications: SellerApplicationsService) {}

  @Get()
  findAll(
    @Query(
      'status',
      new ParseEnumPipe(SellerApplicationStatus, { optional: true }),
    )
    status?: SellerApplicationStatus,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ): Promise<SellerApplication[]> {
    return this.applications.findAll({ status, take, skip });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SellerApplication> {
    return this.applications.findOne(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<SellerApplication> {
    return this.applications.approve(id, admin);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectApplicationDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<SellerApplication> {
    return this.applications.reject(id, dto, admin);
  }
}
