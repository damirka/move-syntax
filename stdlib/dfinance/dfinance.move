address 0x0 {

/// Dfinance is a governance module which handles balances merging. It's basically
/// a mediator or wrapper around money-related operations. It holds knowledge about
/// registered coins and rules of their usage. Also it lessens load from 0x0::Account
module Dfinance {

    use 0x0::Transaction;
    use 0x0::Signer;

    resource struct T<Coin> {
        value: u128
    }

    resource struct Info<Coin> {
        denom: vector<u8>,
        decimals: u8,

        // for tokens
        is_token: bool,
        owner: address,
        total_supply: u128
    }

    public fun value<Coin>(coin: &T<Coin>): u128 {
        coin.value
    }

    public fun zero<Coin>(): T<Coin> {
        T<Coin> { value: 0 }
    }

    public fun split<Coin>(coin: T<Coin>, amount: u128): (T<Coin>, T<Coin>) {
        let other = withdraw(&mut coin, amount);
        (coin, other)
    }

    public fun join<Coin>(coin1: T<Coin>, coin2: T<Coin>): T<Coin> {
        deposit(&mut coin1, coin2);
        coin1
    }

    public fun deposit<Coin>(coin: &mut T<Coin>, check: T<Coin>) {
        let T { value } = check; // destroy check
        coin.value = coin.value + value;
    }

    public fun withdraw<Coin>(coin: &mut T<Coin>, amount: u128): T<Coin> {
        Transaction::assert(coin.value >= amount, 10);
        coin.value = coin.value - amount;
        T { value: amount }
    }


    /// Work in progress. Make it public when register_token_info becomes native.
    /// Made private on purpose not to make a hole in chain security, though :resource
    /// constraint kinda-does the job and won't allow users to mint new 'real' coins
    public fun tokenize<Token: resource>(account: &signer, total_supply: u128, decimals: u8, denom: vector<u8>): T<Token> {

        let owner = Signer::address_of(account);

        // check if this token has never been registered
        Transaction::assert(!::exists<Info<Token>>(0x0), 1);

        let info = Info {denom, decimals, owner, total_supply, is_token: true };
        register_token_info<Token>(info);

        T<Token> { value: total_supply }
    }

    /// Created Info resource must be attached to 0x0 address.
    /// Keeping this public until native function is ready.
    native fun register_token_info<Coin: resource>(info: Info<Coin>);

    /// Working with CoinInfo - coin registration procedure, 0x0 account used

    /// What can be done here:
    ///   - proposals API: user creates resource Info, pushes it into queue
    ///     0x0 government reads and registers proposed resources by taking them
    ///   - try to find the way to share Info using custom module instead of
    ///     writing into main register (see above)

    /// getter for denom. reads denom information from 0x0 resource
    public fun denom<Coin>(): vector<u8> acquires Info {
        *&borrow_global<Info<Coin>>(0x0).denom
    }

    /// getter for currency decimals
    public fun decimals<Coin>(): u8 acquires Info {
        borrow_global<Info<Coin>>(0x0).decimals
    }

    /// getter for is_token property of Info
    public fun is_token<Coin>(): bool acquires Info {
        borrow_global<Info<Coin>>(0x0).is_token
    }

    /// getter for total_supply property of Info
    public fun total_supply<Coin>(): u128 acquires Info {
        borrow_global<Info<Coin>>(0x0).total_supply
    }

    /// getter for owner property of Info
    public fun owner<Coin>(): address acquires Info {
        borrow_global<Info<Coin>>(0x0).owner
    }

    /// only 0x0 address and add denom descriptions, 0x0 holds information resource
    public fun register_coin<Coin>(account: &signer, denom: vector<u8>, decimals: u8) {
        assert_can_register_coin(account);

        move_to<Info<Coin>>(account, Info {
            denom,
            decimals,

            owner: 0x0,
            total_supply: 0,
            is_token: false
        });
    }

    /// check whether sender is 0x0, helper method
    fun assert_can_register_coin(account: &signer) {
        Transaction::assert(Signer::address_of(account) == 0x0, 1);
    }
}
}
