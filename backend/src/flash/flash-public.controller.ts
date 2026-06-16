import { Controller, Get, Param } from '@nestjs/common';
import { FlashService } from './flash.service';

@Controller('api/mp/flash')
export class FlashPublicController {
  constructor(private readonly flashService: FlashService) {}

  @Get(':id/viewer')
  getFlashForViewer(@Param('id') id: string) {
    return this.flashService.getFlashForViewer(id);
  }
}
