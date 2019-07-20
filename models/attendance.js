const mongoose=require('mongoose');
const _=require('lodash');

var AttendanceSchema=new mongoose.Schema({
    employeeNo:{
        type:String,
        require:true,
        trim:true,
    },
    Name:{
        type:String,
        require:true,
        trim:true,
    },

    Date:{
        type:String,
        required:true,
        trim:true
    },
    Day:{
        type:String,
        required:true,
        trim:true 
    },
    Shift:{
        type:String,
        default:undefined
    },
    InTime:{
        type:String,
        default:undefined
    },
    OutTime:{
        type:String,
        default:undefined
    },
    Hours:{
        type:String,
        default:undefined
    },
    SessionLabel1:{
        type:String,
        required:true,
        trim:true 
    },
    SessionLabel2:{
        type:String,
        required:true,
        trim:true 
    },
    C_HOD:{
        type:String
    },
    Cafeteria:{
        type:String,
        required:true,
        trim:true 
    },
    Recreation:{
        type:String,
        required:true,
        trim:true 
    },
    OutOfTurnstile:{
        type:String,
        required:true,
        trim:true 
    },
    Total:{
        type:String,
        required:true
    },
    Year:{
        type:String,
        required:true
    }


});


var Attendance=mongoose.model('Attendance',AttendanceSchema);
module.exports={Attendance};