import {Resolver, Query, Mutation, Arg, ObjectType, Field} from 'type-graphql';
import { User } from './entity/User';
import {hash,compare} from 'bcryptjs'
import { sign } from 'jsonwebtoken';

@ObjectType()
class LoginResponse {
    @Field()
    accessToken:string
}

@Resolver()
export class UserResolver{

    @Query(()=>String)
     hello(){
         return 'hi';
     }

     @Query(()=>[User])
     users(){
         return User.find();
     }

     @Mutation(()=>LoginResponse)
     async login(
         @Arg('email') email :string,
         @Arg('password') password:string
         ):Promise<LoginResponse>
     {
       
        //check if user exist
        const user = await User.findOne({where:{email}})
        if(!user){
            throw new Error("could not find user")
        }
        //check if the password match
        const valid = await compare(password,user.password);
        if(!valid){
            throw new Error("Invalid Password ??");
        }

        //login successful
        //create Tokin 

         const accessToken = sign(password,process.env.ACCESS_TOKEN_SECRET!);

         return {
             accessToken
         }
    
     }
     

    
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