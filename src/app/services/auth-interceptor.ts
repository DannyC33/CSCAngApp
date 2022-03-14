import { HttpHandler, HttpInterceptor, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MyApplication } from '../application';
import { DebugService } from './debug.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
        constructor(private debugService: DebugService){};
        intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
        //    console.log('DEBUG!: Attention! '+JSON.stringify(req));
            let headers = new HttpHeaders();
            headers = headers.append('x-app-name', MyApplication.name);
            headers = headers.append('x-api-key', MyApplication.api_key);
            headers = headers.append('x-auth-language', 'en');
            if (sessionStorage.getItem('token')) {

                headers = headers.append('x-auth-token', sessionStorage.getItem('token'));
            }
            // console.log('interceptor! ', headers);
            const copieReq = req.clone({headers: headers});
            // console.log(copieReq);
            return next.handle(copieReq);

        }
}
