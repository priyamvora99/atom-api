const express=require('express');
const bodyParser=require('body-parser');
const session=require('express-session');
const xlsxj = require("xlsx-to-json-lc");
const _=require('lodash');
const moment=require('moment');
const dt=require('date-and-time');
const fs=require('fs');

const port=process.env.PORT || 3000;

const mongoose=require('../db/mongoose-connect');
const {User}=require('../models/user');
const {Attendance}=require('../models/attendance');

var app=express();
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    const url="https://priyamvora99.github.io"
    res.setHeader('Access-Control-Allow-Origin', url);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
app.use(session({
    secret:'mysecret'
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.post("/signup",(req,res)=>{
   
    var user=new User(req.body);

    user.save().then((document)=>{
       
      res.status(200).send("Success");
    }).catch((err)=>{
        console.log(err);
        res.status(400).send(err);
    });
 
});
app.post("/login",(req,res)=>{
    
    User.findByCredentials(req.body.email,req.body.password).then((user)=>{
        req.session.email=req.body.email;
        console.log("session: ",req.session);
        res.send(user);
    }).catch((err)=>{
        console.log("login ",err);
        res.status(400).send(err);
    });
});

app.post("/uploadAttendance",(req,res)=>{
    console.log(req.body);
    var modelName=req.body.modelName;
    var fileName=req.body.fileName;
    var fileExists=false;
    if(fs.existsSync(modelName+".json")){
        console.log("in if");
        fileExists=true;
        var x=modelName.split("_");
                  var year=x[2];
                  console.log(year);
        res.send(fileExists);
    }else{
        console.log("in else");
        xlsxj({
            input:fileName,
            output:modelName+'.json',
            lowerCaseHeaders:true, //converts excel header rows into lowercase as json keys
            sheet:'Sheet1'
         
         },function(err,result){
             if(err){
                 res.send(err);
             }else{
               
                  var newArr=[];
                  var x=modelName.split("_");
                  var year=x[2];
                  console.log(year);

                 for(var i=0;i<result.length;i++){
                     newArr.push(_.pickBy(result[i]));
                 }
                 
              
                 var arr=newArr.filter((val)=> Object.keys(val).length !==0);
                
                 var yearObj={};
                 yearObj.year=year;
                 for(var i=0;i<arr.length;i++){
                     arr[i].year=year;
                 }
                 console.log(arr);
                 Attendance.collection.insertMany(arr,(err,docs)=>{
                     if(err){
                         res.send(err);
                     }else{
                        
                         res.send("Inserted "+docs.insertedCount+" record(s).");
                     }
                 });
                
             
                 
                 
             }
         });
    }
    
     
    

});
app.get("/getYear",(req,res)=>{
    Attendance.collection.distinct("year",function(err,result){
       res.status(200).send(result);
    }); 
});

app.get("/getSummary",(req,res)=>{
    console.log(req.query.substr);
    Attendance.find({
        "date":{
            "$regex":req.query.substr,
            "$options": "i" 
        }
    }).then((docs)=>{
        docs = JSON.parse(JSON.stringify(docs));
    
        var inTime=[];
        var outTime=[];
        var hours=[];
        var sessionLabel1=[];
        var sessionLabel2=[];
        var cafe=[];
        var recreational=[];
        var outOfTurnstile=[];
        var total=[];
        var lateArrivalAfterFlexiHours=[];
        var halfDayLeave=[];
        //var fullDayLeave=[];
        
       if(docs.length == 0){
        
            res.status(404).send('No records for selected month found');
       }
       
       for(var i=0;i<docs.length;i++){
           if(docs[i]['in time'] === undefined){
              
               inTime[i]='00:00:00';
               outTime[i]='00:00:00';
               hours[i]='00:00:00';
           }else{
                inTime[i]=docs[i]['in time'];
                outTime[i]=docs[i]['out time'];
                hours[i]=docs[i].hours;
           }
           if(docs[i].cafeteria === '0' ){
               cafe[i]='00:00';
           }else{
            cafe[i]=docs[i].cafeteria;
           }
           
           if(docs[i].recreation === '0' ){
                recreational[i]='00:00';
            }else{
                recreational[i]=docs[i].recreation;
            }

            if(docs[i]['out of turnstile'] === '0' ){
                outOfTurnstile[i]='00:00';
            }else{
                outOfTurnstile[i]=docs[i]['out of turnstile'];
            
            }
            if(docs[i].total === '0' ){
                total[i]='00:00:00';
            }else{
                total[i]=docs[i].total
            }
           sessionLabel1[i]=docs[i]['session label1'];
           sessionLabel2[i]=docs[i]['session label2'];
           
       }
     
       //[{ "emp_id": { emp_name: "", date: { play: "", }, summary: {}  } }]
       var uniqueId=[...new Set(docs.map(doc=>doc.employeeno))];
       var uniqueName=[...new Set(docs.map(doc=>doc.name))];
       var dates=[...new Set(docs.map(doc=>doc.date))]
       var uniquec_hod=[...new Set(docs.map(doc=>doc.c_hod))]
      
       var responseObj=[];
       for(var i=0;i<uniqueId.length;i++){
           responseObj.push({});
       }
       console.log(responseObj);
       for(var i=0;i<responseObj.length;i++){
           var id=uniqueId[i];
           responseObj[i][id]={};
       }
       for(var i=0;i<responseObj.length;i++){
           var obj=responseObj[i];
           var key=Object.keys(obj);
           obj[key].name=uniqueName[i];
           for(var j=0;j<dates.length;j++){
                var date=dates[j];
                obj[key][date]={};

           }
           obj[key].summary={};
        }
       var count=0;
       for(var i=0;i<responseObj.length;i++){
           var obj=responseObj[i];
           var key=Object.keys(obj);
           var dateKeys=Object.keys(obj[key]);
           dateKeys.splice(0,1);
           dateKeys.splice(dateKeys.length-1,1);
           for(var j=0;j<dateKeys.length;j++){
               obj[key][dateKeys[j]].intime=inTime[count];
               obj[key][dateKeys[j]].outtime=outTime[count];
               obj[key][dateKeys[j]].hours=hours[count];
               obj[key][dateKeys[j]].sessionlabel1=sessionLabel1[count];
               obj[key][dateKeys[j]].sessionlabel2=sessionLabel2[count];
               obj[key][dateKeys[j]].cafeteria=cafe[count];
               obj[key][dateKeys[j]].recreation=recreational[count];
               obj[key][dateKeys[j]].outOfTurnstile=outOfTurnstile[count];
               obj[key][dateKeys[j]].total=total[count];
               count++;
            }
       }
       for(var i=0;i<responseObj.length;i++){
           var obj=responseObj[i];
           var key=Object.keys(obj);
           var summaryKey=Object.keys(obj[key]);
           var key1=summaryKey.pop();
           if(uniquec_hod.length == 1){
            obj[key][key1].c_hod=uniquec_hod[0];
           }else{
                for(var j=0;j<uniquec_hod.length;j++){
                    obj[key][key1].c_hod=uniquec_hod[j];
                }
           }
       }

       var shiftBaseTime=moment('09:00','hh:mm');
       var lowerTimeForHalfDay=moment('04:00','hh:mm');
       var upperTimeForHalfDay=moment('07:00','hh:mm');

       for(var i=0;i<responseObj.length;i++){
            var leaveCount=0;
            var obj=responseObj[i];
            var key=Object.keys(obj);
            var allKeys=Object.keys(obj[key]);
            allKeys.splice(0,1);
            var summaryKey=allKeys.pop();

            for(var j=0;j<allKeys.length-1;j++){
                var hours=obj[key][allKeys[j]].hours;
                var totalWorkTime=moment(hours,'hh:mm');
                if(obj[key][allKeys[j]].sessionlabel1 === 'Leave' && obj[key][allKeys[j]].sessionlabel2 === 'Leave'){
                   leaveCount++;
                }
              
                if(hours!== '00:00:00'){
                    if(!(obj[key][allKeys[j]].sessionlabel1 === 'Outdoor Duty' || obj[key][allKeys[j]].sessionlabel1 === 'SATURDAY OFF' )){
                        if(totalWorkTime.isBefore(lowerTimeForHalfDay)){
                            leaveCount++;
                        }
                    }
                   
                }
                    
                
                
            }
            obj[key][summaryKey].leaveCount=leaveCount;
        }
        var flexiTimeForGeneralShift=moment('10:30:00','hh:mm:ss');
        for(var i=0;i<responseObj.length;i++){
            lateArrivalAfterFlexiHours[i]=0;
            halfDayLeave[i]=0;
        }

      
        for(var i=0;i<responseObj.length;i++){
            var count=0;
            var count1=0;
            var obj=responseObj[i];
            var key=Object.keys(obj);
            var allKeys=Object.keys(obj[key]);
            allKeys.splice(0,1);
            allKeys.splice(allKeys.length-1,1);
            for(var j=0;j<allKeys.length;j++){
                var time=moment(obj[key][allKeys[j]].intime,'hh:mm:ss');
                var hours=obj[key][allKeys[j]].hours;
                var totalWorkTime=moment(hours,'hh:mm');
                
                if(time.isAfter(flexiTimeForGeneralShift)){
                    if(!(obj[key][allKeys[j]].sessionlabel1 === 'Outdoor Duty' || obj[key][allKeys[j]].sessionlabel1 === 'SATURDAY OFF' )){
                        count++;
                        lateArrivalAfterFlexiHours[i]=count;
                        
                        if(!(totalWorkTime.isAfter(shiftBaseTime))){
                            if(!(totalWorkTime.isBefore(lowerTimeForHalfDay))){
                                count1++;
                                halfDayLeave[i]=count1;
                            }
                            
                        }
                        if(lateArrivalAfterFlexiHours[i]>4 && totalWorkTime.isAfter(shiftBaseTime)){
                            count1++;
                            halfDayLeave[i]=count1;
                        }
                    }
                }
                if(!(obj[key][allKeys[j]].sessionlabel1 === 'Outdoor Duty' || obj[key][allKeys[j]].sessionlabel1 === 'SATURDAY OFF' )){
                    if(totalWorkTime.isAfter(lowerTimeForHalfDay) && totalWorkTime.isBefore(upperTimeForHalfDay)){
                        count1++;
                        halfDayLeave[i]=count1;
                    }
                }
                
                
            }
        }
        console.log("lateArrivalAfterFlexiHours: ",lateArrivalAfterFlexiHours);
        console.log("Half day leave: ",halfDayLeave);
        
      var sendData=[];
      for(var i=0;i<responseObj.length;i++){
          sendData[i]={};
          var obj=responseObj[i];
          var key=Object.keys(obj);
          var allKeys=Object.keys(obj[key]);
          var summaryKey=allKeys.pop();

          sendData[i].employeeno=key;
          sendData[i].name=obj[key].name;
          sendData[i].hod=obj[key][summaryKey].c_hod;
          sendData[i].leaves=obj[key][summaryKey].leaveCount;
          sendData[i].penaltyForFlexiHours=lateArrivalAfterFlexiHours[i];
          sendData[i].halfDayLeave=halfDayLeave[i];
      }
      

    
  
      //console.log(JSON.stringify(responseObj,null,2));
      console.log(sendData);
      res.status(200).send(sendData);
    }).catch((err)=>{
        res.status(404).send(err);
    });
});

app.get('/detailSummary',(req,res)=>{
    Attendance.find({
        "date":{
            "$regex":req.query.substr,
            "$options": "i" 
        },
        "employeeno":req.query.eid
    }).then((docs)=>{
       
        docs = JSON.parse(JSON.stringify(docs));
    
        var inTime=[];
        var outTime=[];
        var hours=[];
        var sessionLabel1=[];
        var sessionLabel2=[];
        var cafe=[];
        var recreational=[];
        var outOfTurnstile=[];
        var total=[];
        var lateArrivalAfterFlexiHours=[];
        var halfDayLeave=[];
        
        //{'ATOM26000':{ajay surana: {01 Apr 2019:{}}}}
      
       
       for(var i=0;i<docs.length;i++){
           if(docs[i]['in time'] === undefined){
              
               inTime[i]='00:00:00';
               outTime[i]='00:00:00';
               hours[i]='00:00:00';
           }else{
                inTime[i]=docs[i]['in time'];
                outTime[i]=docs[i]['out time'];
                hours[i]=docs[i].hours;
           }
           if(docs[i].cafeteria === '0' ){
               cafe[i]='00:00';
           }else{
            cafe[i]=docs[i].cafeteria;
           }
           
           if(docs[i].recreation === '0' ){
                recreational[i]='00:00';
            }else{
                recreational[i]=docs[i].recreation;
            }

            if(docs[i]['out of turnstile'] === '0' ){
                outOfTurnstile[i]='00:00';
            }else{
                outOfTurnstile[i]=docs[i]['out of turnstile'];
            
            }
            if(docs[i].total === '0' ){
                total[i]='00:00:00';
            }else{
                total[i]=docs[i].total
            }
           sessionLabel1[i]=docs[i]['session label1'];
           sessionLabel2[i]=docs[i]['session label2'];
           
       }
       var uniqueId=[...new Set(docs.map(doc=>doc.employeeno))];
       var uniqueName=[...new Set(docs.map(doc=>doc.name))];
       var dates=[...new Set(docs.map(doc=>doc.date))];
       var days=[...new Set(docs.map(doc=>doc.day))];
      console.log(days);
       var responseObj=[];
       for(var i=0;i<uniqueId.length;i++){
           responseObj.push({});
       }
       
       for(var i=0;i<responseObj.length;i++){
           var id=uniqueId[i];
           responseObj[i][id]={};
       }
       for(var i=0;i<responseObj.length;i++){
        var obj=responseObj[i];
        var key=Object.keys(obj);
        obj[key].name=uniqueName[i];
        for(var j=0;j<dates.length;j++){
             var date=dates[j];
             obj[key][date]={};

        }
       
     }
    

     var count=0;
     var count1=0;
       for(var i=0;i<responseObj.length;i++){
           var obj=responseObj[i];
           var key=Object.keys(obj);
           var dateKeys=Object.keys(obj[key]);
          
           dateKeys.splice(0,1);
          
          
           for(var j=0;j<dateKeys.length;j++){
               obj[key][dateKeys[j]].intime=inTime[count];
               obj[key][dateKeys[j]].outtime=outTime[count];
               obj[key][dateKeys[j]].hours=hours[count];
               obj[key][dateKeys[j]].sessionlabel1=sessionLabel1[count];
               obj[key][dateKeys[j]].sessionlabel2=sessionLabel2[count];
               obj[key][dateKeys[j]].cafeteria=cafe[count];
               obj[key][dateKeys[j]].recreation=recreational[count];
               obj[key][dateKeys[j]].outOfTurnstile=outOfTurnstile[count];
               obj[key][dateKeys[j]].total=total[count];
               obj[key][dateKeys[j]].day=days[count1];

               count++;
               count1++;
               if(count1==7){
                   count1=0;
               }
            }
       }

       var shiftBaseTime=moment('09:00','hh:mm');
       var lowerTimeForHalfDay=moment('04:00','hh:mm');
       var upperTimeForHalfDay=moment('07:00','hh:mm');

       for(var i=0;i<responseObj.length;i++){
           
            var obj=responseObj[i];
            var key=Object.keys(obj);
            var allKeys=Object.keys(obj[key]);
            allKeys.splice(0,1);
           

            for(var j=0;j<allKeys.length;j++){
                var hours=obj[key][allKeys[j]].hours;
                var totalWorkTime=moment(hours,'hh:mm');
                if(obj[key][allKeys[j]].sessionlabel1 === 'Leave' && obj[key][allKeys[j]].sessionlabel2 === 'Leave'){
                   obj[key][allKeys[j]].fullDayLeave='Yes';
                
                }else{
                    obj[key][allKeys[j]].fullDayLeave='No'; 
                }
              
                if(hours!== '00:00:00'){
                    if(!(obj[key][allKeys[j]].sessionlabel1 === 'Outdoor Duty' || obj[key][allKeys[j]].sessionlabel1 === 'SATURDAY OFF' )){
                        if(totalWorkTime.isBefore(lowerTimeForHalfDay)){
                            obj[key][allKeys[j]].fullDayLeave='Yes';
                        }
                    }
                   
                }
                
                
                
            }
           
        }
        var flexiTimeForGeneralShift=moment('10:30:00','hh:mm:ss');
        for(var i=0;i<responseObj.length;i++){
            lateArrivalAfterFlexiHours[i]=0;
            halfDayLeave[i]=0;
        }

      
        for(var i=0;i<responseObj.length;i++){
            var count=0;
            var count1=0;
            var obj=responseObj[i];
            var key=Object.keys(obj);
            var allKeys=Object.keys(obj[key]);
            allKeys.splice(0,1);
           
            for(var j=0;j<allKeys.length;j++){
                var time=moment(obj[key][allKeys[j]].intime,'hh:mm:ss');
                var hours=obj[key][allKeys[j]].hours;
                var totalWorkTime=moment(hours,'hh:mm');
                
                if(time.isAfter(flexiTimeForGeneralShift)){
                    if(!(obj[key][allKeys[j]].sessionlabel1 === 'Outdoor Duty' || obj[key][allKeys[j]].sessionlabel1 === 'SATURDAY OFF' )){
                        count++;
                        lateArrivalAfterFlexiHours[i]=count;
                        obj[key][allKeys[j]].lateArrivalAfterFlexiHoursCount=count;
                        if(!(totalWorkTime.isAfter(shiftBaseTime))){
                            if(!(totalWorkTime.isBefore(lowerTimeForHalfDay))){
                                count1++;
                                halfDayLeave[i]=count1;
                                obj[key][allKeys[j]].halfDayLeaveNumber=count1;
                            }
                            
                        }
                        if(lateArrivalAfterFlexiHours[i]>4 && totalWorkTime.isAfter(shiftBaseTime)){
                            count1++;
                            halfDayLeave[i]=count1;
                            obj[key][allKeys[j]].halfDayLeaveNumber=count1;
                        }
                    }else{
                        obj[key][allKeys[j]].lateArrivalAfterFlexiHoursCount='No';      
                    }
                }else{
                    obj[key][allKeys[j]].lateArrivalAfterFlexiHoursCount='No';  
                }
                if(!(obj[key][allKeys[j]].sessionlabel1 === 'Outdoor Duty' || obj[key][allKeys[j]].sessionlabel1 === 'SATURDAY OFF' )){
                    if(totalWorkTime.isAfter(lowerTimeForHalfDay) && totalWorkTime.isBefore(upperTimeForHalfDay)){
                        count1++;
                        halfDayLeave[i]=count1;
                        obj[key][allKeys[j]].halfDayLeaveNumber=count1;
                    }
                }
                
                
            }
        }
       console.log("priyam: ",JSON.stringify(responseObj,null,2));
       res.status(200).send(responseObj);
    }).catch((err)=>{
        console.log(err);
    });
});

app.listen(port,()=>{
    console.log("Listening to port ",port);
});