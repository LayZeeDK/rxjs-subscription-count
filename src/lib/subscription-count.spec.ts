import * as chai from 'chai';
import { interval, Observable, Subject, Subscription } from 'rxjs';
import { takeUntil, toArray } from 'rxjs/operators';
import { SinonSpy, spy } from 'sinon';
import * as sinonChai from 'sinon-chai';

import { subscriptionCount } from './subscription-count';

chai.use(sinonChai);
const { expect } = chai;

function observedValue<T>(observer: SinonSpy): T {
  const [first] = observer.getCall(observer.callCount - 1).args;

  return first;
}

describe((subscriptionCount as any).name, () => {
  const counter: SinonSpy = spy();
  const destroy: Subject<void> = new Subject();
  const countedInterval$: Observable<number> = interval(0).pipe(
    subscriptionCount({ next: counter }),
    takeUntil(destroy),
  );

  function currentCount(): number {
    return counter.lastCall.args[0];
  }

  afterEach(() => {
    destroy.next();
    counter.resetHistory();
  });

  afterAll(() => {
    destroy.complete();
  });

  describe('counter', () => {
    it('notifies the counter on subscription', () => {
      countedInterval$.subscribe();

      expect(counter.calledOnce).to.be.true;
      expect(observedValue(counter)).to.equal(1);
    });

    it('notifies the counter on multiple subscriptions', () => {
      countedInterval$.subscribe();
      countedInterval$.subscribe();
      countedInterval$.subscribe();

      expect(counter.calledThrice).to.be.true;
      expect(currentCount()).to.equal(3);
    });

    it('notifies the counter on unsubscription', () => {
      const subscription: Subscription = countedInterval$.subscribe();

      subscription.unsubscribe();

      expect(counter.calledTwice).to.be.true;
      expect(currentCount()).to.equal(0);
    });

    it('notifies the counter on multiple unsubscriptions', () => {
      const firstSubscription: Subscription = countedInterval$.subscribe();
      const secondSubscription: Subscription = countedInterval$.subscribe();
      countedInterval$.subscribe();

      firstSubscription.unsubscribe();
      secondSubscription.unsubscribe();

      expect(counter.callCount).to.equal(5);
      expect(currentCount()).to.equal(1);
    });

    it('does not notify the counter before subscription to the source', () => {
      expect(counter.called).to.be.false;
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
      const primitiveObserver: SinonSpy = spy();
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

      expect(primitiveObserver.lastCall.args[0]).to.deep.equal([
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
      const arrayObserver: SinonSpy = spy();
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

      const emittedValues: ReadonlyArray<Primitive> =
        arrayObserver.getCalls().map(x => x.args[0]);
      expect(emittedValues).to.deep.equal([
        booleans,
        numbers,
        strings,
        symbols,
        nulls,
        undefineds,
      ]);
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
      const objectObserver: SinonSpy = spy();
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

      const emittedValues: ReadonlyArray<Value<Primitive>> =
        objectObserver.getCalls().map(x => x.args[0]);
      expect(emittedValues).to.deep.equal([
        zero,
        one,
        two,
        three,
        four,
        five,
      ]);
    });
  });
});
