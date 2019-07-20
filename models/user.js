const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcrypt');
var UserSchema=new mongoose.Schema({
    email:{
        type:String,
        require:true,
        unique:true,
        trim:true,
        minlength:1,
        validate:{
            validator:validator.isEmail,
            message:'{VALUE} is not a valid email'
        }
        

    },
    password:{
        type:String,
        require:true,
        minlength:6
    },
    phone:{
        type:String,
        require:true,
        maxlength:10,
        minlength:10,
        validate:{
            validator:validator.isMobilePhone,
            message:'{VALUE} is not a valid phone number'
        }
    }
});

UserSchema.pre('save',function(next){
    var user=this;
    if(user.isModified('password')){
        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(user.password,salt,(err,hash)=>{
                user.password=hash;
                next();
            });
        });
    }else{
        next();
    }
})


UserSchema.statics.findByCredentials=function(email,password){
    var user=this;
    return User.findOne({email}).then((user)=>{
        console.log(user);
        
        if(!user){
            console.log("in !user if condition");
            
            return Promise.reject('No user found with given email.Check if email is valid else sign in.');
        }
        return new Promise((resolve,reject)=>{
            console.log("In bcrypt promise");
            
            bcrypt.compare(password,user.password,(err,res)=>{
                if(res){
                    resolve(user);
                }else{
                    
                    reject('Invalid password.Try again');
                }
            });
        });
    });
};
var User=mongoose.model('User',UserSchema); 
module.exports={User}