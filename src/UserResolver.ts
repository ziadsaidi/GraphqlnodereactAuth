import {Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware,Int} from 'type-graphql';
import { User } from './entity/User';
import {hash,compare} from 'bcryptjs'
import { BaseEntity, getConnection } from 'typeorm';
import { MyContext, PayloadObject } from './MyContext';
import { createAccessToken, createRefreshToken } from './Auth';
import { isAuth } from './isAuth';
import { SendRefreshToken } from './sendRefreshToken';
import { verify } from 'jsonwebtoken';

@ObjectType()
class LoginResponse {
    @Field()
    accessToken:string
    @Field()
    user:User
}


@ObjectType()
class RegisterResponse{
    @Field()
    ok:boolean;
    @Field()
    message:string;
    @Field()
    errors?:string;
}

@Resolver()
export class UserResolver extends BaseEntity{



    @Query(()=>String)
     hello(){
         return 'hi';
     }


     // Get User ID 
     // Tests
    @Query(()=> String )
    @UseMiddleware(isAuth)
    bye(@Ctx() {payload}:MyContext){
        return ` The user Id is ${payload!.userId}`
    }


    //Get All Users
     @Query(()=>[User])
     users(){
         return User.find();
     }

     //Get User 
     @Query(()=> User,{nullable:true})
     me(
         @Ctx() context:MyContext
     )
     
     {
        const authorization = context.req.headers['authorization']
        if(!authorization){
            return null;
          }
          try{
              const token = (authorization as string).split(' ')[1];
              const payload  = <PayloadObject> verify(token,process.env.ACCESS_TOKEN_SECRET!)
              context.payload = payload
              return User.findOne({id:payload.userId})
        
          }
          catch(err){
           return null;
        
          }

        

     }


    //Kill all User Refresh Session 
     @Mutation(()=> Boolean)
     async revokeRefreshTokensForUsers(
         @Arg('userId',()=> Int) userId:number
     )
     {
        await getConnection()
              .getRepository(User)
              .increment({id:userId},"tokenVersion",1)
         return true;

     }


   
     //deleteAll users Mutation
     // I will return boolaean for Simplicity 
     @Mutation(()=> Boolean)
     async deleteAllUsers()
     {
            await getConnection()
           .getRepository(User)
            .clear()
            return true;
     }


    // Delete Mutation
     @Mutation(()=>Boolean)
     async  deleteUser(
         @Arg('userId') userId:number
     ): Promise<boolean>{
         
        //first way using data mapper design pattern 
        try{
            await getConnection()
            .createQueryBuilder()
            .delete()
            .from(User)
            .where("id = :id", { id: userId })
            .execute();
            return true;

        }
        catch(err){
            console.log(err);
            return false;
        }
     }
     //Login Mutation
     @Mutation(()=>LoginResponse)
     async login(
         @Arg('email') email :string,
         @Arg('password') password:string,
         @Ctx() {res}:MyContext
         ):Promise<LoginResponse>
     {
       
        //check if user exist
        const user = await User.findOne({where:{email}})
        if(!user){
            throw new Error("could not find user")
        }
        //check if the passwords  match
        const valid = await compare(password,user.password);
        if(!valid){
            throw new Error("Invalid Password ??");
        }

        //login successful
        //create Refresh Token 
        const refreshToken = createRefreshToken(user);
        //add refresh token to cookie
        SendRefreshToken(res,refreshToken);
        //create Access Token 
         const accessToken = createAccessToken(user);
         
         return {
             accessToken,
             user
         }
    
     }

     // Logout Mutation
     @Mutation(()=>Boolean)
     async  logout(
         @Ctx() {res}:MyContext
     ): Promise<boolean>{

        SendRefreshToken(res,"");
         return true;
     }
     

    //register Mutation
     @Mutation(()=>RegisterResponse)
     async register(
         @Arg('email') email :string,
         @Arg('password') password:string
         ):Promise<RegisterResponse>
     {
        const salt = 12;
        const hashedPassword = await hash(password,salt);
        try
        {
            //check user existance before insert data 

           const user = await  User.findOne({email})
           if(user){
               throw new Error(`User With Email ${user.email} already exist`)
           }
            await User.insert({
                email,
                password:hashedPassword
            })
        }
        catch(errors)
        {
            return{
                ok:false,
                message:"Unable to register User check the errros Field for more details",
                errors
        }
    }
     
         return  {
             ok:true,
             message:"Register user Successfully!"
         }
    
     }
     
}