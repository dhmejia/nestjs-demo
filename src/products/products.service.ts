import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as IsUUID} from 'uuid';
import { Product, ProductImage } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ){}

  async create(createProductDto: CreateProductDto) {
    
    try {

      const { images = [], ...productProperties } = createProductDto;

      const product = this.productRepository.create({
        ...productProperties,
        images: images.map( image => this.productImageRepository.create({ url: image}))
    });
      await this.productRepository.save(product);

      return {...product, images};

    } catch (error) {
      this.handleDbExceptions(error);
      
    }
  }

  async findAll(paginationDto:PaginationDto) {
    
    const {limit = 10, offset = 0} = paginationDto; //desestructura objeto 
    
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      }
    });

    return products.map( product => ({
      ...product,
      images: product.images.map( img => img.url)
    }))

  }

  async findOne(term: string) {

    let product: Product;

    if(IsUUID(term)){
      product = await this.productRepository.findOneBy({id:term});
    }else{
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder.
        where('UPPER(title) =:title or slug =:slug', {
          title: term.toLocaleUpperCase(),
          slug: term.toLocaleLowerCase()
        })
        .leftJoinAndSelect('prod.images','prodImages')
        .getOne();
    }  
      
    if (!product) {
      throw new NotFoundException(`Product with term ${term} not found`);
    }
    return product;

  }

  async findOnePlain( term: string){

    const { images = [], ...rest } = await this.findOne( term );

    return {
      ...rest,
      images: images.map( image => image.url )
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    
    const { images, ...toUpdate} = updateProductDto;

    const product = await this.productRepository.preload({
      id: id,
      ...toUpdate
    });

    if(!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    
    //se usa para hacer transacciones, se debe inyectar en el constructor.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();



    try {

      //Borrar imagenes si llegan nuevas
      if ( images ){
        await queryRunner.manager.delete( ProductImage, { product: { id } })
        
        product.images = images.map(
          image => this.productImageRepository.create({ url: image })
        )
      }

      //Intenta las dos transacciones: borrar y crear nuevas imagenes.
      await queryRunner.manager.save(product);
      
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(product.id);

      //return await this.productRepository.save(product);
    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDbExceptions(error);
      
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private handleDbExceptions(error: any) {
    if(error.code === '23505')  //error de constrain
        throw new BadRequestException(error.detail);

      this.logger.error(error);
      throw new InternalServerErrorException('Unexpected error, check server logs');
  }

  //Borrar todos los datos en la db
  async deleteAllProducts(){

    const query = this.productRepository.createQueryBuilder('product');
    
    try{
      
      return await query
        .delete()
        .where({})
        .execute();

    } catch( error ) {
      this.handleDbExceptions( error );
    }
  }
}
