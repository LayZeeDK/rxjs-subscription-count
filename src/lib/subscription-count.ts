import { Observable, PartialObserver, Subscription } from 'rxjs';

function notifyObserver<T>(message: T, observer: PartialObserver<T>): void {
  if (!observer
    || observer.closed === true
    || observer.next === undefined
  ) {
    return;
  }

  observer.next(message);
}

export function subscriptionCount<T>(
  counterObserver: PartialObserver<number>,
): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>): Observable<T> => {
    let subscriptionCounter: number = 0;

    return Observable.create((observer: PartialObserver<T>): () => void => {
      const innerSubscription: Subscription = source.subscribe(observer);
      subscriptionCounter += 1;
      notifyObserver(subscriptionCounter, counterObserver);

      return (): void => {
        innerSubscription.unsubscribe();
        subscriptionCounter -= 1;
        notifyObserver(subscriptionCounter, counterObserver);
      };
    });
  };
}
