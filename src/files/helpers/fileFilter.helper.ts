

export const fileFilter = (rep: Express.Request, file: Express.Multer.File, callback: Function ) => {

    if( !file ){
        return callback(new Error('File is empty'), false);
    }

    const fileExtension = file.mimetype.split('/')[1];
    const validExtesions = ['jpg', 'png', 'gif', 'jpeg'];

    if( validExtesions.includes(fileExtension) ){
        return callback(null, true);
    }
    //Si el callback retorna false el archivo se rechaza.
    callback(null, false);
    
}