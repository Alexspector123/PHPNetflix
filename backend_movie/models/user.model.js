import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },



    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: "",
    },
    searchHistory: {
        type: Array,
        default: [],
    },
    favourites: {
        type: Array,
        default: [],
    },
    isVip: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    language: {
        type: String,
        enum: ['English', 'Tiếng Việt'],  
        default: 'English',
      }
      
   
});

export const User = mongoose.model('User', userSchema);
