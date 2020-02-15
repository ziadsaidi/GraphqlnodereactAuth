import {Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx} from 'type-graphql';
import { User } from './entity/User';
import {hash,compare} from 'bcryptjs'
import { BaseEntity } from 'typeorm';
import { MyContext } from './MyContext';
import { createAccessToken, createRefreshToken } from './Auth';

@ObjectType()
class LoginResponse {
    @Field()
    accessToken:string
}

@Resolver()
export class UserResolver extends BaseEntity{

    @Query(()=>String)
     hello(){
         return 'hi';
     }

     @Query(()=>[User])
     users(){
         return User.find();
     }


     //Login Route
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
        const refreshToken = createRefreshToken(user)

        res.cookie("klid",refreshToken,{
            httpOnly:true
        });
        //create Access Token 
         const accessToken = createAccessToken(user);
         
         return {
             accessToken
         }
    
     }
     

    //register Route
     @Mutation(()=>Boolean)
     async register(
         @Arg('email') email :string,
         @Arg('password') password:string
         )
     {
        const salt = 12;
        const hashedPassword = await hash(password,salt);
        try
        {
            await User.insert({
                email,
                password:hashedPassword
            })
        }
        catch(e)
        {
            console.log(e);
            return false;
        }
     
         return  true;
    
     }
     
}