import Images from "@/models/Images";
import mongoose, { Schema } from "mongoose";

const filesDb = mongoose.connection.useDb("Files");
const FilesSchema = new Schema(
    {
        name: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: false,
        },
        created_by: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
FilesSchema.virtual("thumbnails", {
    ref: Images, // The model to use for populating
    localField: "_id", // Field in the Files schema
    foreignField: "file_id", // Field in the Images schema
    justOne: false, // Set to false to populate multiple documents
    options: { limit: 3 }, // Limiting to the first three images
});
const Files = filesDb.model("Files", FilesSchema);
export default Files;
