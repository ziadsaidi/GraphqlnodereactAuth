import { MiddlewareFn } from "type-graphql";
import { MyContext, PayloadObject } from "./MyContext";
import {verify} from 'jsonwebtoken'


// token format
// inside the headers
// bearer lkdksdnjbshvhzzsbjbjbcksnsl
export const isAuth:MiddlewareFn<MyContext> = ({context},next)=>{
  const authorization = context.req.headers['authorization']

  if(!authorization){
    throw new Error("User Not Authenticated horray!!");
  }
  try{
      const token = (authorization as string).split(' ')[1];
      const payload  = <PayloadObject> verify(token,process.env.ACCESS_TOKEN_SECRET!)
      context.payload = payload

  }
  catch(err){
    console.log(err);

  }
return next();
}