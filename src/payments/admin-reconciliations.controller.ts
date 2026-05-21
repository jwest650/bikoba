import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Role, type ReconcileEvent, type ReconcileRun } from '@prisma/client';
import { Type } from 'class-transformer';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  PaymentsService,
  type ReconcileReport,
} from './payments.service';

class TriggerReconcileDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30 * 24)
  lookbackHours?: number;
}

@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/reconciliations')
export class AdminReconciliationsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  findAll(
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ): Promise<ReconcileRun[]> {
    return this.payments.listReconcileRuns({ take, skip });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReconcileRun & { events: ReconcileEvent[] }> {
    return this.payments.getReconcileRun(id);
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  trigger(@Body() dto: TriggerReconcileDto): Promise<ReconcileReport> {
    return this.payments.triggerReconcileNow(dto.lookbackHours ?? 24);
  }
}
