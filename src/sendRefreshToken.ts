
import {Response} from 'express';

export const SendRefreshToken = (res:Response, refreshToken:string):void => {
    res.cookie("klid",refreshToken,{
        httpOnly:true,
        path:"/refresh_token"
    });
}