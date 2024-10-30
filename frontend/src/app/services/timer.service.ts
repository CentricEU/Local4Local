import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { commonRoutingConstants } from '../_constants/common-routing.constants';

@Injectable({
  providedIn: 'root'
})
export class TimerService {

  private timerSubscription: Subscription;

  constructor(private router: Router) {}

  public startTimer(duration: number): void {
    this.stopTimer();
    this.timerSubscription = timer(duration).subscribe(() => {
      this.router.navigate([commonRoutingConstants.login]);
    });
  }

  public stopTimer(): void {
    this.timerSubscription?.unsubscribe();
  }
}
