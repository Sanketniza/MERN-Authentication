
import ErrorHandler from '../middlewares/error.js'; // Correct path
import User from "../models/user.model.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { sendEmail } from "../util/sendEmail.js";
import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID , process.env.TWILIO_AUTH_TOKEN);


export const registerUser = catchAsyncError(async (req, res, next) => {

    try{

        const {name , email , password , phone , verificationMethod} = req.body;

        if(!name || !email || !password || !phone || !verificationMethod){
            return next(new ErrorHandler("All fields must be required",400));
        }

        function validatePhoneNumber(phone) {
            const phoneRegex = /^\+91[6-9]\d{9}$/;
            return phoneRegex.test(phone);
        }

        if(!validatePhoneNumber(phone)){
            return next(new ErrorHandler("Please enter a valid phone number",400));
        }

        const existingUser = await User.findOne({
            $or : [
                {
                    email,
                    accountVerified : true,
                },

                {
                    phone,
                    accountVerified : true,
                },
            ],
        });

        if(existingUser){
            return next(new ErrorHandler("User already exists with this email or phone",400));
        }

        const registrationAttemptsByUser = await User.find({

            $or : [
                {
                    email,
                    accountVerified : false,
                },

                {
                    phone,
                    accountVerified : false,
                },
            ],
        });

        if ( registrationAttemptsByUser.length > 3) {
            return next(new ErrorHandler("You have exceeded the maximum number of registration attempts. Please try again later", 400));
        }

        const userData = {
            name,
            email,
            phone,
            password,
          };
      
          const user = await User.create(userData);
          const verificationCode = await user.generateVerificationCode();
          await user.save();

        sendVerificationCode(verificationMethod , verificationCode , name , email , phone , res);

    } catch(err){
        next(err);
    }
});

async function sendVerificationCode(verificationMethod , verificationCode , name , email , phone  ,res) {

    try{

        if(verificationMethod === "email"){
            // send verification code to email
            const message = generateEmailTemplate(verificationCode);

            sendEmail({
                email,
                subject : "Account Verification Code",
                message
            })

            res.status(201).json({
                success : true,
                message : `Verification code sent to email ${name}`,
            });

        } 

        else if(verificationMethod === "phone"){
            // send verification code to phone
            const verificationCodeWithSpace = verificationCode.toString().split("").join(" ");

            await client.calls.create({

                twiml : `<Response>
                            <Say> 
                                Your Name is ${name} 
                                Your verification code is ${verificationCodeWithSpace} again
                                Your verification code is ${verificationCodeWithSpace}
                            </Say>
                        </Response>`,
                       

                from : process.env.TWILIO_PHONE,
                to : phone,
                // message : `Your verification code is ${verificationCodeWithSpace}`,
            });

            // const message = `Your verification code is ${verificationCodeWithSpace}`;

            res.status(201).json({
                success : true,
                message : `OTP send ${name}`,
            });


        }

        else {
            return res.status(500).json({
                success : false,
                message : "Invalid verification method",
            });
            // throw new ErrorHandler("Invalid verification method",500);
        }

    } catch(err){
        console.log(err);
        return res.status(500).json({
            success : false,
            message : "Error sending verification code",
        });
        // throw new ErrorHandler("Error sending verification code",500);
    }
}

function generateEmailTemplate(verificationCode) {

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
          <p style="font-size: 16px; color: #333;">Dear User,</p>
          <p style="font-size: 16px; color: #333;">Your verification code is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
              ${verificationCode}
            </span>
          </div>
          <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
          <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
          <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
            <p>Thank you,<br>Student_Hub</p>
            <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
          </footer>
        </div>
  `;

}