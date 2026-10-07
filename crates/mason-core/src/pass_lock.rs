//! A `RwLock` that a layout pass holds exclusively for its whole duration.
//!
//! Layout takes the tree lock thousands of times per pass through short-lived guards, and those
//! atomic lock/unlock pairs were a quarter to a third of text layout time. While a pass is active,
//! its thread already has exclusive access, so its own lock calls only check ownership. Other
//! threads wait on the real lock until the pass ends, exactly as they would for one long guard.
//!
//! Nesting rules are unchanged: code that would deadlock under a plain `RwLock` (asking for any
//! lock while holding a write guard) must still not do it, which is what keeps `&`/`&mut` from
//! aliasing.

use parking_lot::lock_api::{self, GuardNoSend, RawRwLock as _};
use std::sync::atomic::{AtomicU32, AtomicUsize, Ordering};

pub struct PassRawRwLock {
    inner: parking_lot::RawRwLock,
    /// Id of the thread running a pass, or 0.
    owner: AtomicUsize,
    /// Nested pass depth; only touched by the owner.
    depth: AtomicU32,
}

// Android's Rust targets use emulated TLS, so ask bionic, which reads the thread register.
#[cfg(target_os = "android")]
#[inline(always)]
fn current_thread() -> usize {
    extern "C" {
        fn pthread_self() -> usize;
    }
    // SAFETY: always valid; `pthread_t` is pointer-sized and non-zero for a live thread.
    unsafe { pthread_self() }
}

#[cfg(not(target_os = "android"))]
#[inline(always)]
fn current_thread() -> usize {
    thread_local!(static MARKER: u8 = const { 0 });
    // A thread-local's address is unique among live threads and never 0.
    MARKER.with(|m| m as *const u8 as usize)
}

impl PassRawRwLock {
    #[inline(always)]
    fn held_by_current_pass(&self) -> bool {
        // Only the owner ever stores its own id, so a relaxed load is enough here. Outside a
        // pass the owner is 0 and the thread lookup is skipped.
        let owner = self.owner.load(Ordering::Relaxed);
        owner != 0 && owner == current_thread()
    }

    /// Take the lock exclusively until the matching `end_pass`. Re-entrant on the same thread.
    pub fn begin_pass(&self) {
        if self.held_by_current_pass() {
            self.depth.fetch_add(1, Ordering::Relaxed);
            return;
        }
        self.inner.lock_exclusive();
        self.depth.store(1, Ordering::Relaxed);
        self.owner.store(current_thread(), Ordering::Relaxed);
    }

    /// # Safety
    /// Must pair with a `begin_pass` on this thread, after every guard taken inside it is gone.
    pub unsafe fn end_pass(&self) {
        debug_assert!(self.held_by_current_pass());
        if self.depth.fetch_sub(1, Ordering::Relaxed) == 1 {
            self.owner.store(0, Ordering::Relaxed);
            self.inner.unlock_exclusive();
        }
    }
}

unsafe impl lock_api::RawRwLock for PassRawRwLock {
    #[allow(clippy::declare_interior_mutable_const)]
    const INIT: Self = PassRawRwLock {
        inner: parking_lot::RawRwLock::INIT,
        owner: AtomicUsize::new(0),
        depth: AtomicU32::new(0),
    };

    // A guard taken inside a pass must be released on the pass's thread.
    type GuardMarker = GuardNoSend;

    #[inline]
    fn lock_shared(&self) {
        if !self.held_by_current_pass() {
            self.inner.lock_shared();
        }
    }

    #[inline]
    fn try_lock_shared(&self) -> bool {
        self.held_by_current_pass() || self.inner.try_lock_shared()
    }

    #[inline]
    unsafe fn unlock_shared(&self) {
        if !self.held_by_current_pass() {
            self.inner.unlock_shared();
        }
    }

    #[inline]
    fn lock_exclusive(&self) {
        if !self.held_by_current_pass() {
            self.inner.lock_exclusive();
        }
    }

    #[inline]
    fn try_lock_exclusive(&self) -> bool {
        // Inside a pass an outer frame may still hold references into the tree, so an
        // opportunistic writer (NodeRef::drop) must defer instead.
        !self.held_by_current_pass() && self.inner.try_lock_exclusive()
    }

    #[inline]
    unsafe fn unlock_exclusive(&self) {
        if !self.held_by_current_pass() {
            self.inner.unlock_exclusive();
        }
    }

    #[inline]
    fn is_locked(&self) -> bool {
        self.inner.is_locked()
    }
}

pub type RawRwLock = PassRawRwLock;
pub type RwLock<T> = lock_api::RwLock<PassRawRwLock, T>;
pub type RwLockReadGuard<'a, T> = lock_api::RwLockReadGuard<'a, PassRawRwLock, T>;
pub type RwLockWriteGuard<'a, T> = lock_api::RwLockWriteGuard<'a, PassRawRwLock, T>;

/// Holds both of a tree's locks for one layout pass.
pub(crate) struct PassGuard<'a> {
    locks: [&'a PassRawRwLock; 2],
}

impl<'a> PassGuard<'a> {
    pub(crate) fn enter(first: &'a PassRawRwLock, second: &'a PassRawRwLock) -> Self {
        first.begin_pass();
        second.begin_pass();
        Self {
            locks: [first, second],
        }
    }
}

impl Drop for PassGuard<'_> {
    fn drop(&mut self) {
        // SAFETY: paired with `enter`; guards taken during the pass are scoped inside it.
        unsafe {
            self.locks[1].end_pass();
            self.locks[0].end_pass();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::AtomicBool;
    use std::sync::Arc;
    use std::time::Duration;

    #[test]
    fn nested_guards_and_passes_inside_a_pass_do_not_block() {
        let lock = RwLock::new(0u32);
        let raw = unsafe { lock.raw() };
        raw.begin_pass();
        raw.begin_pass();
        {
            let a = lock.read();
            let b = lock.read();
            assert_eq!(*a + *b, 0);
        }
        *lock.write() = 1;
        unsafe { raw.end_pass() };
        assert!(raw.is_locked(), "inner pass must not release the outer one");
        unsafe { raw.end_pass() };
        assert!(!raw.is_locked());
        assert_eq!(*lock.read(), 1);
    }

    #[test]
    fn owner_try_write_fails_during_a_pass() {
        let lock = RwLock::new(());
        let raw = unsafe { lock.raw() };
        raw.begin_pass();
        assert!(lock.try_write().is_none());
        unsafe { raw.end_pass() };
        assert!(lock.try_write().is_some());
    }

    #[test]
    fn other_threads_wait_for_the_pass() {
        let lock = Arc::new(RwLock::new(0u32));
        let raw = unsafe { lock.raw() };
        raw.begin_pass();
        let done = Arc::new(AtomicBool::new(false));
        let worker = {
            let (lock, done) = (Arc::clone(&lock), Arc::clone(&done));
            std::thread::spawn(move || {
                assert!(lock.try_read().is_none());
                let v = *lock.read();
                done.store(true, Ordering::SeqCst);
                v
            })
        };
        std::thread::sleep(Duration::from_millis(50));
        assert!(
            !done.load(Ordering::SeqCst),
            "reader got in during the pass"
        );
        *lock.write() = 7;
        unsafe { raw.end_pass() };
        assert_eq!(worker.join().unwrap(), 7);
    }
}
