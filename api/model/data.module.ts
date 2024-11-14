import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    queryString: {
        type: String,
        required: true
    }
});

const File = mongoose.model('File', fileSchema);

export default File;