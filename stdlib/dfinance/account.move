address 0x0 {

/// Account is the access point for assets flow. It holds withdraw-deposit handlers
/// for generic currency <Token>. It also stores log of sent and received events
/// for every account.
module Account {

    use 0x0::Transaction;
    use 0x0::Dfinance;
    use 0x0::Event;

    /// holds account data, currently, only events
    resource struct T {
        sent_events: Event::EventHandle<SentPaymentEvent>,
        received_events: Event::EventHandle<ReceivedPaymentEvent>,
    }

    resource struct Balance<Token> {
        coin: Dfinance::T<Token>
    }

    /// Message for sent events
    struct SentPaymentEvent {
        amount: u128,
        denom: vector<u8>,
        payee: address,
        metadata: vector<u8>,
    }

    /// Message for received events
    struct ReceivedPaymentEvent {
        amount: u128,
        denom: vector<u8>,
        payer: address,
        metadata: vector<u8>,
    }

    /// Init wallet for measurable currency, hence accept <Token> currency
    public fun accept<Token>() {
        move_to_sender<Balance<Token>>(Balance { coin: Dfinance::zero<Token>() })
    }

    public fun can_accept<Token>(payee: address): bool {
        ::exists<Balance<Token>>(payee)
    }

    public fun exists(payee: address): bool {
        ::exists<T>(payee)
    }

    public fun balance<Token>(): u128 acquires Balance {
        balance_for<Token>(Transaction::sender())
    }

    public fun balance_for<Token>(addr: address): u128 acquires Balance {
        Dfinance::value(&borrow_global<Balance<Token>>(addr).coin)
    }

    public fun deposit<Token>(payee: address, to_deposit: Dfinance::T<Token>)
    acquires T, Balance {
        deposit_with_metadata(payee, to_deposit, x"")
    }

    public fun deposit_to_sender<Token>(to_deposit: Dfinance::T<Token>)
    acquires T, Balance {
        deposit(Transaction::sender(), to_deposit)
    }

    public fun deposit_with_metadata<Token>(
        payee: address,
        to_deposit: Dfinance::T<Token>,
        metadata: vector<u8>
    ) acquires T, Balance {
        deposit_with_sender_and_metadata(
            payee,
            Transaction::sender(),
            to_deposit,
            metadata
        )
    }

    public fun pay_from_sender<Token>(payee: address, amount: u128)
    acquires T, Balance {
        pay_from_sender_with_metadata<Token>(
            payee, amount, x""
        )
    }

    public fun pay_from_sender_with_metadata<Token>(payee: address, amount: u128, metadata: vector<u8>)
    acquires T, Balance {
        deposit_with_metadata<Token>(
            payee,
            withdraw_from_sender(amount),
            metadata
        )
    }

    fun deposit_with_sender_and_metadata<Token>(
        payee: address,
        sender: address,
        to_deposit: Dfinance::T<Token>,
        metadata: vector<u8>
    ) acquires T, Balance {
        let amount = Dfinance::value(&to_deposit);
        Transaction::assert(amount > 0, 7);

        let denom = Dfinance::denom<Token>();
        let sender_acc = borrow_global_mut<T>(sender);

        // add event as sent into account
        Event::emit_event<SentPaymentEvent>(
            &mut sender_acc.sent_events,
            SentPaymentEvent {
                amount, // u64 can be copied
                payee,
                denom: copy denom,
                metadata: copy metadata
            },
        );

        // there's no way to improve this place as payee is not sender :(
        if (!can_accept<Token>(payee)) {
            save_balance<Token>(Balance { coin: Dfinance::zero<Token>() }, payee);
        };

        if (!exists(payee)) {
            new_account(payee);
        };

        let payee_acc     = borrow_global_mut<T>(payee);
        let payee_balance = borrow_global_mut<Balance<Token>>(payee);

        // send money to payee
        Dfinance::deposit(&mut payee_balance.coin, to_deposit);
        // update payee's account with new event
        Event::emit_event<ReceivedPaymentEvent>(
            &mut payee_acc.received_events,
            ReceivedPaymentEvent {
                amount,
                denom,
                metadata,
                payer: sender
            }
        )
    }

    public fun withdraw_from_sender<Token>(amount: u128): Dfinance::T<Token>
    acquires Balance {
        let sender  = Transaction::sender();
        let balance = borrow_global_mut<Balance<Token>>(sender);

        withdraw_from_balance<Token>(balance, amount)
    }

    fun withdraw_from_balance<Token>(balance: &mut Balance<Token>, amount: u128): Dfinance::T<Token> {
        Dfinance::withdraw(&mut balance.coin, amount)
    }

    fun new_account(addr: address) {
        let evt = Event::new_event_generator(addr);
        let acc = T {
            sent_events: Event::new_event_handle_from_generator(&mut evt),
            received_events: Event::new_event_handle_from_generator(&mut evt),
         };

        save_account(acc, evt, addr);
    }

    native fun save_balance<Token>(balance: Balance<Token>, addr: address);
    native fun save_account(account: T, event_generator: Event::EventHandleGenerator, addr: address);
}
}
