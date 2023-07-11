import multer from 'multer';

/**    multer.diskStorage is used to define the disk storage
 settings for uploaded files.

    Inside the diskStorage configuration, there are two functions:
     destination and filename.

    The destination function specifies the directory where the 
    uploaded files should be stored. In this case, it's set to 
    'uploads/', which means the files will be saved in the 
    uploads folder located in the root directory of your server.

    The filename function determines the name of the uploaded file.
     It takes in the req (request) and file objects, as well as a 
     cb (callback) function to be called when the file name is determined.

    Inside the filename function, a unique suffix is generated using
     Date.now() and a random number. This ensures that each file has
      a unique name to avoid conflicts.

    The original file name is extracted using file.originalname and 
    split by the dot (.) to get the file extension. The pop() method
     retrieves the last element of the resulting array, 
     which represents the file extension.

    The filename is constructed by combining the file.fieldname, 
    the unique suffix, the dot separator, and the file extension.

    Finally, the filename is processed by replacing any backslashes
     (\) with forward slashes (/) using a regular expression and 
     the replace() method. This ensures that the file path is 
     consistent, regardless of the platform.

    The modified filename is passed to the cb callback function,
     along with null for the error parameter, indicating that 
     the file name has been successfully determined.

    The upload object is created using multer and the defined 
    storage configuration. This upload object can be used as 
    middleware in the routes to handle file uploads.

Overall, this code sets up the configuration for multer to handle 
file uploads, including specifying the destination directory and
 generating unique file names. */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop();
    const filePath = filename.replace(/\\/g, '/'); // the file path should use forward slashes (/) instead of backslashes (\).
    cb(null, filePath);
  },
});

export const upload = multer({ storage });
