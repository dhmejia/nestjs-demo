import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, Res } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter, fileNamer } from './helpers';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) {}

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string){

    const path = this.filesService.getStaticProductImage( imageName );
    
    res.sendFile( path);
  }

  //Los archivos se envía con post
  @Post('product') 
  @UseInterceptors( FileInterceptor('file' , {
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, //10MB
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer,
    }), 
  }) )

  uploadProductImage( 
    @UploadedFile() file: Express.Multer.File 
  ){

    if (!file){
      throw new BadRequestException('El archivo debe ser una imagen');
    }

    console.log({ fileInController: file})

    const secureUrl = `${ this.configService.get('HOST_API') }/files/product/${ file.filename }`;
    return { 
      secureUrl
    };
  }

}
