import { HttpHandler, HttpInterceptor, HttpRequest, HttpEvent, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DebugService } from './debug.service';
import { Injectable } from '@angular/core';


@Injectable()
export class IncomingInterceptor implements HttpInterceptor {

        intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
           const debugService = new DebugService();

           return next.handle(req)
            .pipe(tap(
                (event: HttpEvent<any>) => {
                    if (event instanceof HttpResponse) {
                        debugService.console('IncomingInterceptor');
                        debugService.console('Incoming '+JSON.stringify(event));
                        const token = event.headers.get('x-auth-token');
                        if (token) {
                            debugService.console('Incoming token: '+token);
                            sessionStorage.setItem('token', token);
                            localStorage.setItem('token', token);

                        } else {
                            debugService.console('no token received');
                        }
                    }
                    return event;
                }

                )

                );

        }

}
