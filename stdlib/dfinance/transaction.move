address 0x0 {

module Transaction {

    // Soon to be DEPRECATED!
    native public fun sender(): address;

    // inlined
    public fun assert(check: bool, code: u64) {
        if (check) () else abort code
    }
}
}
