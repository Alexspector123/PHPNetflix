import { User } from '../models/user.model.js';
import bcryptjs, { genSalt } from 'bcryptjs';
import { generateTokenAndSetCookie } from '../utils/generateToken.js';

export async function signup(req, res) {
    try {
        const {email, password, username} = req.body;
        //Check input parameters
        if(!email || !password || !username) {
            return res.status(400).json({success: false, message: "All fields are required"});
        }

        //Check valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)) {
            return res.status(400).json({success: false, message: "Invalid email"});
        }

        //Check password length
        if(password.length < 5) {
            return res.status(400).json({success: false, message: "Password must be at least 5 characters"});
        }

        //Check existing account with username and email
        const existingUserByEmail = await User.findOne({email: email});
        if(existingUserByEmail) {
            return res.status(400).json({success: false, message: "Already exist account with this email"});
        }
        const existingUserByUsername = await User.findOne({username: username});
        if(existingUserByUsername) {
            return res.status(400).json({success: false, message: "Already exist account with this username"});
        } 

        //Hashed password before safe to the database
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "avatar3.png"];
        const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];

        //Create new user 
        const newUser = new User({
            email: email,
            password: hashedPassword,
            username:username,
            image:image,
        });
        if(newUser) {
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();
            res.status(201).json({success: true, user: {
                ...newUser._doc,
                password:""
            },});
        } 
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}

export async function login(req, res) {
    try {
        const {email, password} = req.body;

        //Check input parameters
        if(!email || !password) {
            return res.status(400).json({success: false, message: "All fields are required"});
        }

        //Check valid email and password
        const user = await User.findOne({email: email});
        if(!user) {
            return res.status(404).json({success: false, message: "Invalid credentials"});
        }
        const isPasswordCorrect = await bcryptjs.compare(password, user.password);
        if(!isPasswordCorrect) {
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }

        generateTokenAndSetCookie(user._id, res);
        res.status(200).json({success: true, user: {
            ...newUser._doc,
            password:""
        },});
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}

export async function logout(req, res) {
    try {
        res.clearCookie("jwt-netflix");
        res.status(200).json({success: true, message: "Logged out successfully"});
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}