
import { v4 as uuid} from 'uuid';

export const fileNamer = (rep: Express.Request, file: Express.Multer.File, callback: Function ) => {

    if( !file ){
        return callback(new Error('File is empty'), false);
    }

    const fileExtension = file.mimetype.split('/')[1];
    
    const fileName = `${uuid()}.${ fileExtension }`;
    //Retorna el nuevo nombre.
    callback(null, fileName);
    
}