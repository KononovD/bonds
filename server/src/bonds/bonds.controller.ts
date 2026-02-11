import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { BondsService } from './bonds.service';
import { BondsCatalogService } from './bonds-catalog.service';
import { CreateBondDto, UpdateBondDto } from './dto/bond.dto';

@Controller('api/bonds')
export class BondsController {
  constructor(
    private readonly bondsService: BondsService,
    private readonly catalogService: BondsCatalogService,
  ) {}

  @Get()
  findAll() {
    return this.bondsService.findAll();
  }

  @Get('catalog')
  getCatalog() {
    return this.catalogService.getCatalog();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bondsService.findOne(id);
  }

  @Post()
  create(@Body() createBondDto: CreateBondDto) {
    return this.bondsService.create(createBondDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateBondDto: UpdateBondDto) {
    return this.bondsService.update(id, updateBondDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bondsService.remove(id);
  }
}
