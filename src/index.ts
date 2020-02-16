import "reflect-metadata";
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection } from "typeorm";
import {config} from "dotenv"
import cookieparser from 'cookie-parser'
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { PayloadObject } from "./MyContext";
import { createRefreshToken, createAccessToken } from "./Auth";
import { SendRefreshToken } from "./sendRefreshToken";
import cors from 'cors';

const result = config()
 
if (result.error) {
  throw result.error
}

(async ()=>{
    const app = express();

//custom middleware
    // app.use(function (req, _res, next) {

    //     console.log(req.headers);
    //     next();
    //   });

     app.use(cors({
         credentials:true,
         origin:'http://localhost:3000'
     }))

    app.get('/',(_req,res)=> res.send('hello!!'))

    //set up refresh token Route 

    app.post('/refresh_token',cookieparser(), async (req,res)=>{
       const token = req.cookies.klid;
       if(!token){
           return res.send({ok:false,accessToken:''})
       }
       let payload : PayloadObject ;
       try{
           payload =  <PayloadObject> verify(token,process.env.REFRESH_TOKEN_SECRET!)

       }
       catch(err){
           console.log(err);
           return res.send({ok:false,accessToken:''})
       }

       const user = await User.findOne({where:{id:payload.userId}})
       if(!user){
        return res.send({ok:false,accessToken:''})
       }

       //check the version of the token ---

       if(user.tokenVersion !== payload.tokenVersion){
        return res.send({ok:false,accessToken:''})

       }

       SendRefreshToken(res,createRefreshToken(user));
       return res.send({ok:true,accessToken:createAccessToken(user)})

    })

    await createConnection();
    const apolloServer = new ApolloServer({
       schema: await buildSchema({
           resolvers:[UserResolver]
       }),
       context: ({req,res})=>{
        return {
            req,
            res
        }
       

       }
    })

    apolloServer.applyMiddleware({app,cors:false})

    app.listen(4000,()=>{
        console.log('Listning At Port 4000 ...');
    })


})();

