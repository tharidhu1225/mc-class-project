import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config()
export function createUser(req,res){

  const newUserData = req.body

  if(newUserData.type == "admin"){

    if(req.user==null){
      res.json({
        message: "Please login as administrator to create admin accounts"
      })
      return
    }

    if(req.user.type != "admin"){
      res.json({
        message: "Please login as administrator to create admin accounts"
      })
      return
    }

    if(req.user.type == "unpaid"){
      res.json({
        message: "Please login as administrator to create admin accounts"
      })
    }

  }

  newUserData.password = bcrypt.hashSync(newUserData.password, 10)  

  const user = new User(newUserData)

  user.save().then(()=>{
    res.json({
      message: "User created"
    })
  }).catch((error)=>{
    res.json({      
      message: "User not created"
    })
  })
  
}

export function loginUser(req,res){

  User.find({email : req.body.email}).then(
    (users)=>{
      if(users.length == 0){

        res.json({
          message: "User not found"
        })

      }else{

        const user = users[0]

        const isPasswordCorrect = bcrypt.compareSync(req.body.password,user.password)

        if(isPasswordCorrect){

          const token = jwt.sign({
            email : user.email,
            firstName : user.firstName,
            lastName : user.lastName,
            isBlocked : user.isBlocked,
            type : user.type,
            profilePicture : user.profilePicture
          } , process.env.SECRET)
          
          res.json({
            message: "User logged in",
            token: token,
            user : {
              firstName : user.firstName,
              lastName : user.lastName,
              type : user.type,
              profilePicture : user.profilePicture,
              email : user.email
            }
          })
          
        }else{
          res.json({
            message: "User not logged in (wrong password)"
          })
        }
      }
    }
  )
}

export function isAdmin(req){
  if(req.user==null){
    return false
  }

  if(req.user.type != "admin"){
    return false
  }

  return true
}

export function isCustomer(req){
  if(req.user==null){
    return false
  }

  if(req.user.type != "customer"){
    return false
  }

  return true
}

export function isUnpaid(req){
  if(req.user==null){
    return false
  }

  if(req.user.type != "unpaid"){
    return false
  }

  return true
}

export async function googleLogin(req,res){
  console.log(req.body)
  const token = req.body.token
  //'https://www.googleapis.com/oauth2/v3/userinfo'
  try{
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo',{
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const email = response.data.email
    //check if user exists
    const usersList = await User.find({email: email})
    if(usersList.length >0){
      const user = usersList[0]
      const token = jwt.sign({
        email : user.email,
        firstName : user.firstName,
        lastName : user.lastName,
        isBlocked : user.isBlocked,
        type : user.type,
        profilePicture : user.profilePicture
      } , process.env.SECRET)
      
      res.json({
        message: "User logged in",
        token: token,
        user : {
          firstName : user.firstName,
          lastName : user.lastName,
          type : user.type,
          profilePicture : user.profilePicture,
          email : user.email
        }
      })
    }else{
      //create new user
      const newUserData = {
        email: email,
        firstName: response.data.given_name,
        lastName: response.data.family_name,
        type: "unpaid",
        password: "ffffff",
        profilePicture: response.data.picture
      }
      const user = new User(newUserData)
      user.save().then(()=>{
        res.json({
          message: "User created"
        })
      }).catch((error)=>{
        res.json({      
          message: "User not created"
        })
      })

    }

  }catch(e){
    res.json({
      message: "Google login failed"
    })
  }


}

// malith27@example.com securepassword123 - admin
// malith28@example.com securepassword123 -customer