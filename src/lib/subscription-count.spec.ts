import { interval, Observable, Subject, Subscription } from 'rxjs';
import { takeUntil, toArray } from 'rxjs/operators';

import { subscriptionCount } from './subscription-count';

describe((subscriptionCount as any).name, () => {
  const counter: jasmine.Spy = jasmine.createSpy('counter');
  const destroy: Subject<void> = new Subject();
  const countedInterval$: Observable<number> = interval(0).pipe(
    subscriptionCount({ next: counter }),
    takeUntil(destroy),
  );

  function currentCount(): number {
    return counter.calls.mostRecent().args[0];
  }

  afterEach(() => {
    destroy.next();
    counter.calls.reset();
  });

  afterAll(() => {
    destroy.complete();
  });

  describe('counter', () => {
    it('notifies the counter on subscription', () => {
      countedInterval$.subscribe();

      expect(counter).toHaveBeenCalledTimes(1);
      expect(counter).toHaveBeenCalledWith(1);
    });

    it('notifies the counter on multiple subscriptions', () => {
      countedInterval$.subscribe();
      countedInterval$.subscribe();
      countedInterval$.subscribe();

      expect(counter).toHaveBeenCalledTimes(3);
      expect(currentCount()).toBe(3);
    });

    it('notifies the counter on unsubscription', () => {
      const subscription: Subscription = countedInterval$.subscribe();

      subscription.unsubscribe();

      expect(counter).toHaveBeenCalledTimes(2);
      expect(currentCount()).toBe(0);
    });

    it('notifies the counter on multiple unsubscriptions', () => {
      const firstSubscription: Subscription = countedInterval$.subscribe();
      const secondSubscription: Subscription = countedInterval$.subscribe();
      countedInterval$.subscribe();

      firstSubscription.unsubscribe();
      secondSubscription.unsubscribe();

      expect(counter).toHaveBeenCalledTimes(5);
      expect(currentCount()).toBe(1);
    });

    it('does not notify the counter before subscription to the source', () => {
      expect(counter).toHaveBeenCalledTimes(0);
    });
  });

  describe('messages', () => {
    type Primitive = boolean | number | string | symbol | null | undefined;

    it('leaves primitive values untouched', () => {
      const primitiveSource: Subject<Primitive> = new Subject();
      const countedPrimitive$: Observable<Primitive> = primitiveSource.pipe(
        subscriptionCount({ next: counter }),
        takeUntil(destroy),
      );
      const primitiveObserver: jasmine.Spy = jasmine.createSpy('primitive observer');
      countedPrimitive$.pipe(
        toArray(),
      ).subscribe(primitiveObserver);

      primitiveSource.next(false);
      primitiveSource.next(1);
      primitiveSource.next('two');
      primitiveSource.next(Symbol.for('three'));
      primitiveSource.next(null);
      primitiveSource.next(undefined);
      primitiveSource.complete();

      expect(primitiveObserver).toHaveBeenCalledWith([
        false,
        1,
        'two',
        Symbol.for('three'),
        null,
        undefined,
      ]);
    });

    it('leaves arrays untouched', () => {
      const arraySource: Subject<ReadonlyArray<Primitive>> = new Subject();
      const countedArray$: Observable<ReadonlyArray<Primitive>> =
        arraySource.pipe(
          subscriptionCount({ next: counter }),
          takeUntil(destroy),
        );
      const arrayObserver: jasmine.Spy = jasmine.createSpy('array observer');
      countedArray$.subscribe(arrayObserver);
      const booleans: ReadonlyArray<boolean> =
        [true, false, false, false, true];
      const numbers: ReadonlyArray<number> = [1, 9, 8, 6];
      const strings: ReadonlyArray<string> = ['one', 'silly', 'stream'];
      const symbols: ReadonlyArray<symbol> =
        [Symbol.for('Hello'), Symbol.for('World')];
      const nulls: ReadonlyArray<null> = [null, null, null];
      const undefineds: ReadonlyArray<undefined> = [undefined, undefined];

      arraySource.next(booleans);
      arraySource.next(numbers);
      arraySource.next(strings);
      arraySource.next(symbols);
      arraySource.next(nulls);
      arraySource.next(undefineds);

      expect(arrayObserver.calls.argsFor(0)[0]).toBe(booleans);
      expect(arrayObserver.calls.argsFor(1)[0]).toBe(numbers);
      expect(arrayObserver.calls.argsFor(2)[0]).toBe(strings);
      expect(arrayObserver.calls.argsFor(3)[0]).toBe(symbols);
      expect(arrayObserver.calls.argsFor(4)[0]).toBe(nulls);
      expect(arrayObserver.calls.argsFor(5)[0]).toBe(undefineds);
    });

    it('leaves objects untouched', () => {
      interface Value<T> {
        readonly value: T;
      }

      const objectSource: Subject<Value<Primitive>> = new Subject();
      const countedObject$: Observable<Value<Primitive>> = objectSource.pipe(
        subscriptionCount({ next: counter }),
        takeUntil(destroy),
      );
      const objectObserver: jasmine.Spy = jasmine.createSpy('object observer');
      countedObject$.subscribe(objectObserver);
      const zero: Value<boolean> = { value: false };
      const one: Value<number> = { value: 1 };
      const two: Value<string> = { value: 'two' };
      const three: Value<symbol> = { value: Symbol.for('three') };
      const four: Value<null> = { value: null };
      const five: Value<undefined> = { value: undefined };

      objectSource.next(zero);
      objectSource.next(one);
      objectSource.next(two);
      objectSource.next(three);
      objectSource.next(four);
      objectSource.next(five);

      expect(objectObserver.calls.argsFor(0)[0]).toBe(zero);
      expect(objectObserver.calls.argsFor(1)[0]).toBe(one);
      expect(objectObserver.calls.argsFor(2)[0]).toBe(two);
      expect(objectObserver.calls.argsFor(3)[0]).toBe(three);
      expect(objectObserver.calls.argsFor(4)[0]).toBe(four);
      expect(objectObserver.calls.argsFor(5)[0]).toBe(five);
    });
  });
});
