use super::{CssEffectWriteRecord as Write, FilterProgram, LengthContext, StyleRecordKind};
use std::sync::Arc;

pub struct Effect {
    pub value: String,
    pub records: Arc<[f64]>,
    pub current_color: u32,
    pub filter: Option<Arc<FilterProgram>>,
}

pub struct EffectBatch([Option<Effect>; StyleRecordKind::COUNT]);

impl StyleRecordKind {
    pub(super) fn from_property(name: &str) -> Option<Self> {
        Some(match name {
            "box-shadow" => Self::BoxShadow,
            "text-shadow" => Self::TextShadow,
            "filter" => Self::Filter,
            "backdrop-filter" => Self::BackdropFilter,
            _ => return None,
        })
    }
}

impl EffectBatch {
    /// Applies the final value for each effect, including explicit clears.
    pub fn parse(input: &str, context: LengthContext, initial_color: u32) -> Option<Self> {
        let fields: Vec<_> = input.split('\0').collect();
        if fields.len() % Write::STRIDE != 0 {
            return None;
        }
        let mut final_values = [None; StyleRecordKind::COUNT];
        for row in fields.chunks_exact(Write::STRIDE) {
            if let Some(kind) = StyleRecordKind::from_property(row[Write::PROPERTY]) {
                let color = row[Write::CURRENT_COLOR].parse().unwrap_or(initial_color);
                final_values[kind as usize] = Some((kind, row[Write::VALUE], color));
            }
        }
        Some(Self(final_values.map(|entry| {
            let (kind, value, current_color) = entry?;
            let (records, filter) = if kind == StyleRecordKind::Filter && !value.is_empty() {
                let program = Arc::new(FilterProgram::parse(value));
                (program.records(context, current_color), Some(program))
            } else {
                (kind.parse(value, context, current_color)?, None)
            };
            Some(Effect {
                value: value.into(),
                records: records.into(),
                current_color,
                filter,
            })
        })))
    }

    pub fn get(&self, kind: StyleRecordKind) -> Option<&Effect> {
        self.0[kind as usize].as_ref()
    }

    pub fn iter(&self) -> impl Iterator<Item = (StyleRecordKind, &Effect)> {
        self.0.iter().enumerate().filter_map(|(index, effect)| {
            Some((StyleRecordKind::from_index(index as u8)?, effect.as_ref()?))
        })
    }
}
