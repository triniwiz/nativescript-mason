//! `MasonTextNode`: a DOM text node's data, drawn by the Text that holds it as a run.

use crate::element::Element;
use gtk::glib;
use gtk::subclass::prelude::*;
use std::cell::{Cell, RefCell};

mod imp {
    use super::*;

    #[derive(Default)]
    pub struct TextNode {
        pub data: RefCell<String>,
        pub is_break: Cell<bool>,
        pub owner: glib::WeakRef<Element>,
    }

    #[glib::object_subclass]
    impl ObjectSubclass for TextNode {
        const NAME: &'static str = "MasonTextNode";
        type Type = super::TextNode;
        type ParentType = glib::Object;
    }

    impl ObjectImpl for TextNode {}
}

glib::wrapper! {
    pub struct TextNode(ObjectSubclass<imp::TextNode>);
}

impl Default for TextNode {
    fn default() -> Self {
        Self::new()
    }
}

impl TextNode {
    pub fn new() -> TextNode {
        glib::Object::new()
    }

    pub fn data(&self) -> String {
        self.imp().data.borrow().clone()
    }

    pub fn set_data(&self, value: &str) {
        if *self.imp().data.borrow() == value {
            return;
        }
        self.imp().data.replace(value.to_string());
        self.changed();
    }

    pub fn is_break(&self) -> bool {
        self.imp().is_break.get()
    }

    pub fn set_break(&self, value: bool) {
        if self.imp().is_break.replace(value) != value {
            self.changed();
        }
    }

    pub fn set_owner(&self, owner: Option<&Element>) {
        self.imp().owner.set(owner);
    }

    fn changed(&self) {
        if let Some(owner) = self.imp().owner.upgrade() {
            crate::text::request_rebuild(&owner);
        }
    }
}
