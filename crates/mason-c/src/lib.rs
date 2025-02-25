pub mod ffi;
pub mod node;
pub mod style;
pub mod util;

#[derive(Debug)]
pub struct CMason(mason_core::Mason);

impl CMason {
    pub fn with<F>(&self, func: F)
    where
        F: FnOnce(&mason_core::Mason),
    {
        func(&self.0);
    }

    pub fn with_mut<F>(&mut self, func: F)
    where
        F: FnOnce(&mut mason_core::Mason),
    {
        func(&mut self.0);
    }

    pub fn with_node<F>(&self, node: *mut CMasonNode, func: F)
    where
        F: FnOnce(&mason_core::Node),
    {
        if node.is_null() {
            return;
        }
        unsafe {
            let node_id = (*node).0;
            if let Some(node) = self.0.get_node(node_id) {
                func(node)
            }
        }
    }

    pub fn with_node_mut<F>(&mut self, node: *mut CMasonNode, func: F)
    where
        F: FnOnce(&mut mason_core::Node),
    {
        if node.is_null() {
            return;
        }
        unsafe {
            let node_id = (*node).0;
            if let Some(node) = self.0.get_node_mut(node_id) {
                func(node)
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct CMasonNode(usize);

impl From<mason_core::Node> for CMasonNode {
    fn from(value: mason_core::Node) -> Self {
        Self(value.id())
    }
}

impl From<&mason_core::Node> for CMasonNode {
    fn from(value: &mason_core::Node) -> Self {
        Self(value.id())
    }
}

impl From<&mut mason_core::Node> for CMasonNode {
    fn from(value: &mut mason_core::Node) -> Self {
        Self(value.id())
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct CMasonStyle {
    mason: *mut CMason,
    node: *mut CMasonNode,
}

impl CMasonStyle {
    pub fn get<T, F>(&self, func: F) -> Option<T>
    where
        F: FnOnce(&mason_core::Style) -> Option<T>,
    {
        if self.mason.is_null() || self.node.is_null() {
            return None;
        }
        unsafe {
            let mason = &(*self.mason).0;
            let node_id = (*self.node).0;
            let node = mason.get_node(node_id)?;
            func(node.style())
        }
    }

    pub fn with<F>(&self, func: F)
    where
        F: FnOnce(&mason_core::Style),
    {
        if self.mason.is_null() || self.node.is_null() {
            return;
        }
        unsafe {
            let mason = &(*self.mason).0;
            let node_id = (*self.node).0;
            if let Some(node) = mason.get_node(node_id) {
                func(node.style())
            }
        }
    }

    pub fn with_mut<F>(&self, func: F)
    where
        F: FnOnce(&mut mason_core::Style),
    {
        if self.mason.is_null() || self.node.is_null() {
            return;
        }
        unsafe {
            let mason = &mut (*self.mason).0;
            let node_id = (*self.node).0;
            if let Some(node) = mason.get_node_mut(node_id) {
                func(node.style_mut())
            }
        }
    }
}
