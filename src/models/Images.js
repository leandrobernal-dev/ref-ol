import mongoose, { Schema } from "mongoose";

const imagesDb = mongoose.connection.useDb("Images");
const ImagesSchema = new Schema(
    {
        key: {
            type: String,
            required: false,
        },
        file_id: {
            type: Schema.Types.ObjectId,
            ref: "Files",
            required: true,
        },
        transform: {
            type: Object,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
const Images = imagesDb.model("Images", ImagesSchema);
export default Images;
