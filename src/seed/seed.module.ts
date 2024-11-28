import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { ProductsModule } from './../products/products.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    ProductsModule  //al importar el módulo se importa todo lo que el módulo esté exportando
  ]
})
export class SeedModule {}
