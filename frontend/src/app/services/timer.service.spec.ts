import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TimerService } from './timer.service';
import { commonRoutingConstants } from '../_constants/common-routing.constants';
import { jest } from '@jest/globals';

jest.useFakeTimers();

describe('TimerService', () => {
  let service: TimerService;
  let router: Router;

  beforeEach(() => {
    const routerMock = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        TimerService,
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(TimerService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    service.stopTimer(); 
  });

  it('should start the timer and navigate after the specified duration', () => {
    const duration = 1000;

    service.startTimer(duration);

    jest.advanceTimersByTime(duration);

    expect(router.navigate).toHaveBeenCalledWith([commonRoutingConstants.login]);
  });

  it('should stop the timer if it is running', () => {
    const duration = 1000; 

    service.startTimer(duration);

    service.stopTimer();

    jest.advanceTimersByTime(duration);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle multiple startTimer calls correctly', () => {
    const duration1 = 1000;
    const duration2 = 2000;

    service.startTimer(duration1);

    service.startTimer(duration2);

    jest.advanceTimersByTime(duration1);

    expect(router.navigate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(duration2);

    expect(router.navigate).toHaveBeenCalledWith([commonRoutingConstants.login]);
  });
});
