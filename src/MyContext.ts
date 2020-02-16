
import{
    Request,
    Response
} from 'express';

export class PayloadObject {
    userId:number
    tokenVersion?:number
}

export interface MyContext {
    req:Request,
    res:Response,
    payload?:PayloadObject,
}