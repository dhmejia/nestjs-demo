import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ProductImage } from './entities';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [
    TypeOrmModule.forFeature([Product,ProductImage]),
  ],
  exports: [
    ProductsService,  //para usar los métodos desde otros recursos, se deben importar en los imports del modulo
    TypeOrmModule     //se acostumbra para usar las entities creadas
  ]
})
export class ProductsModule {}
