address 0x1 {
module U256 {
    struct U256 {
        val: vector<u8>,
    }

    /// Creates a `U256` from the given `u8`.
    native public fun from_u8(value: u8): U256;

    /// Creates a `U256` from the given `u64`.
    native public fun from_u64(value: u64): U256;

    /// Creates a `U256` from the given `u128`.
    native public fun from_u128(value: u128): U256;

    /// Converts from `U256` to `u8` with overflow checking.
    native public fun as_u8(value: U256): u8;

    /// Converts from `U256` to `u64` with overflow checking.
    native public fun as_u64(value: U256): u64;

    /// Converts from `U256` to `u128` with overflow checking.
    native public fun as_u128(value: U256): u128;

    /// Checked integer addition. Computes `l` + `r` with overflow checking.
    native public fun add(l: U256, r: U256): U256;

    /// Checked integer subtraction. Computes `l` - `r` with overflow checking.
    native public fun sub(l: U256, r: U256): U256;

    /// Checked integer multiplication. Computes `l` * `r` with overflow checking.
    native public fun mul(l: U256, r: U256): U256;

    /// Checked integer division. Computes `l` / `r`. Throws an `ARITHMETIC_ERROR` if `r` == 0.
    native public fun div(l: U256, r: U256): U256;
}
}
