
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name:String,

    email:{
        type:String,
        required:[true,"Please enter your email"],
        unique:true,
        lowercase:true
    },

    password:{
        type:String,
        minlength:[8,"Password must be at least 8 characters long"],
        maxlength:[32,"Password must be at most 32 characters long"],
        // required:[true,"Please enter your password"],
    },

    phone:String,

    accountVerified:{
        type:Boolean,
        default:false
    },
    
    verificationCode:Number,

    verificationCodeExpire:Date,

    resetPasswordToken:String,

    resetPasswordExpire:Date,

    createdAt:{
        type:Date,
        default:Date.now
    }
});

userSchema.pre("save",async function(next){

    if(!this.isModified("password")){
        next();
    }

    this.password = await bcrypt.hash(this.password,10);
});

userSchema.method.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
}

userSchema.method.generateVerificationCode = function() {

    function generateRandomFiveDigitNumber () {
        const firstDigit = Math.floor(Math.random() * 9) + 1;
        const remainingDigits = Math.floor(Math.random() * 10000).toString().padStart(4, 0);
        return parseInt(firstDigit + remainingDigits);
    }
    
    const verificationCode = generateRandomFiveDigitNumber();
    this.verificationCode = verificationCode;
    this.verificationCodeExpire = Date.now() + 5 * 60 * 1000; // 5 minutes

    return verificationCode;
    
};


const User = mongoose.model("User",userSchema);

export default User;