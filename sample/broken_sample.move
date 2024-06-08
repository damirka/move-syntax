module base_addr_module::base_module {

    public struct A<T> {
        f1: bool,
        f2: T
    }

    public fun return_0(): u64 { abort 42 }

    public fun plus_1_fun(x: u64): u64 { x + 1 }

    public(package) fun friend_fun(x: u64): u64 { x }

    fun non_public_fun(y: bool): u64 { if (y) 0 else 1 }

    entry fun entry_fun() { }

    public fun string() {
        b"\\".to_string()
    }
}
