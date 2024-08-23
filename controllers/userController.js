import User from "../models/userModel.js";
import bcrypt from "bcrypt"
import { generateToken } from "../utils/generateToken.js";
const saltRound = 10;
const userRegisteration = async (req, res) => {

    const { firstName, lastName, email, password } = req.body;
    const hashedPass = await bcrypt.hash(password, saltRound);

    try {
        const user = await User.create({
            firstName,
            lastName,
            email,
            role:'user',
        
            password: hashedPass

        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User Registeration Failed!",
            })
        }

        const token = generateToken(user);

        res.cookie("token", token)
        res.status(201).json({
            success: true,
            message: "User Registeration Successfully Completed",
            user,
            token
        });
        


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })

    }



}
const userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not Found!"

            });
        }
        const isValid = await bcrypt.compare(password, user.password);
        console.log("isValid", isValid);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials!',
                isAuthenticated:false
            });
        }
        const token = generateToken(user);
        res.cookie("token", token);
        res.status(201).json({
            success: true,
            message: "Loged in Successfully!",
            token,
            user,
            isAuthenticated:true
            
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });

    }

}
const getAllUsers = async (req, res) => {


    try {
        const users = await User.find();

        if (!users) {
            return res.status(404).json({
                success: false,
                message: "Users not found!"
            });
        }
        res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });

    }
}
const getSingleUser = async (req, res) => {

    try {
        const { id } = req.params;
        const user = await User.findOne({ _id: id });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Users not found"
            });
        }
        res.status(200).json({
            success: true,
            user
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }

}
const userDelete = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found"

            })
        }
        res.status(200).json({
            success: true,
            message: "Deleted User"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })


    }
}
const userUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email } = req.body;
        const user = await User.findByIdAndUpdate(id, {
            firstName,
            lastName,
            email
        },
            { new: true });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
        }
        res.status(200).json({
            success: true,
            message: "Updated User",
            user
        })



    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}
export { userLogin, userRegisteration, getAllUsers, getSingleUser, userDelete, userUpdate }