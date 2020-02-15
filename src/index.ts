import "reflect-metadata";
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection } from "typeorm";
import {config} from "dotenv"

const result = config()
 
if (result.error) {
  throw result.error
}
 
console.log(result!.parsed);



(async ()=>{
    const app = express();

    app.get('/',(_req,res)=> res.send('hello!!'))

    await createConnection();
    const apolloServer = new ApolloServer({
       schema: await buildSchema({
           resolvers:[UserResolver]
       })
    })

    apolloServer.applyMiddleware({app})

    app.listen(4000,()=>{
        console.log('Listning At Port 4000 ...');
    })


})();

