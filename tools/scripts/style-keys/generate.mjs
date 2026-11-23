// Generates style offsets, dirty bits and CSS record bindings from style-keys.schema.
//
//   node tools/scripts/style-keys/generate.mjs           rewrite the generated blocks
//   node tools/scripts/style-keys/generate.mjs --check   exit 1 when one is stale
//
// A generated block sits between `<style-keys:NAME>` and `</style-keys:NAME>`
// marker comments; everything outside the markers is hand-written and untouched.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const SCHEMA = resolve(here, 'style-keys.schema');
const SCHEMA_REL = relative(root, SCHEMA).replaceAll('\\', '/');

const SIZES = { u8: 1, i8: 1, i32: 4, u32: 4, f32: 4, i64: 8 };
const LANGS = ['rust', 'kotlin', 'swift', 'ts', 'cpp'];

export function parseSchema(text) {
  const style = [];
  const state = [];
  const stateGroups = [];
  const writes = [];
  const accessors = [];
  const lengthSetters = [];
  const layoutMath = [];
  let layoutMathType;
  const keywords = [];
  const records = [];
  const recordLayouts = [];
  const filterOperations = [];
  const cssParseKinds = [];
  const cssMathProperties = new Set();
  const gridProperties = [];
  const borderSides = [];
  let section = null;
  let offset = 0;
  let bit = 0;
  const fail = (line, msg) => {
    throw new Error(`${SCHEMA_REL}:${line}: ${msg}`);
  };

  text.split('\n').forEach((raw, i) => {
    const line = i + 1;
    const hash = raw.indexOf('#');
    const body = (hash >= 0 ? raw.slice(0, hash) : raw).trim();
    const comment = hash >= 0 ? raw.slice(hash + 1).trim() : '';
    const header = /^\[(\w+)\]$/.exec(body);
    if (header) {
      section = header[1];
      if (!['style', 'state', 'state_groups', 'writes', 'accessors', 'length_setters', 'layout_math', 'keywords', 'records', 'record_layouts', 'filter_operations', 'css_parse_kinds', 'grid_properties', 'css_math_properties', 'border_sides'].includes(section)) fail(line, `unknown section [${section}]`);
      return;
    }
    if (section === 'css_math_properties') {
      if (!body) return;
      for (const name of body.split(/\s+/)) {
        if (!/^-?[a-z][a-z0-9-]*$/.test(name) || cssMathProperties.has(name)) fail(line, `invalid or duplicate CSS math property ${name}`);
        cssMathProperties.add(name);
      }
      return;
    }
    if (section === 'layout_math') {
      if (!body) return;
      if (body.startsWith('type=')) {
        const type = Number(body.slice(5));
        if (layoutMathType !== undefined || !Number.isInteger(type) || type < 10 || type > 127) {
          fail(line, 'expected one unused layout type byte');
        }
        layoutMathType = type;
        return;
      }
      const [name, target, mode, extra] = body.split(/\s+/);
      if (!/^[a-z][a-z0-9-]*$/.test(name) || !target || (mode && mode !== 'signed') || extra || layoutMath.some((entry) => entry.name === name)) {
        fail(line, 'expected a unique CSS property, a layout field and an optional signed flag');
      }
      layoutMath.push({ name, target, signed: mode === 'signed', line });
      return;
    }
    if (section === 'state_groups') {
      if (!body) return;
      const [name, languages, ...members] = body.split(/\s+/);
      const langs = languages?.split(',');
      if (!/^[A-Z][A-Z0-9_]*$/.test(name) || !members.length
        || !langs?.every((lang) => ['swift', 'kotlin', 'ts', 'cpp'].includes(lang))
        || new Set(langs).size !== langs.length || stateGroups.some((group) => group.name === name)) {
        fail(line, 'expected a distinct dirty group, languages and member flags');
      }
      stateGroups.push({ name, langs, members, line });
      return;
    }
    if (section === 'border_sides') {
      if (!body) return;
      const [side, ...corners] = body.split(/\s+/);
      const names = ['top', 'right', 'bottom', 'left'];
      const vertices = ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_RIGHT', 'BOTTOM_LEFT'];
      if (!names.includes(side) || corners.length !== 2 || corners[0] === corners[1]
        || corners.some((corner) => !vertices.includes(corner) || !corner.split('_').includes(side.toUpperCase()))
        || borderSides.some((entry) => entry.side === side)) fail(line, 'expected one physical side and its two adjacent corners');
      borderSides.push({ side, corners, line });
      return;
    }
    if (['records', 'record_layouts', 'filter_operations', 'css_parse_kinds', 'grid_properties'].includes(section)) {
      if (!body) return;
      const [name, ...parts] = body.split(/\s+/);
      const identifier = /^[A-Z][A-Z0-9_]*$/;
      if (!identifier.test(name)) fail(line, `invalid record name ${name}`);
      if (section === 'records') {
        const [id, revision, layout] = parts;
        if (parts.length !== 3 || id !== String(records.length) || records.length > 255) {
          fail(line, 'expected the next u8 record ID followed by a revision field and layout');
        }
        if (records.some((record) => record.name === name || record.revision === revision)) fail(line, 'duplicate record name or revision');
        records.push({ name, id: Number(id), revision, layout, line });
      } else if (section === 'record_layouts') {
        if (!parts.length || !parts.every((field) => identifier.test(field) && field !== 'STRIDE') || new Set(parts).size !== parts.length) {
          fail(line, 'expected distinct record fields');
        }
        if (recordLayouts.some((layout) => layout.name === name)) fail(line, `duplicate record layout ${name}`);
        recordLayouts.push({ name, fields: parts, line });
      } else {
        const codes = { filter_operations: filterOperations, css_parse_kinds: cssParseKinds, grid_properties: gridProperties }[section];
        const tracks = section === 'grid_properties' && parts[1] === 'tracks';
        if (parts.length !== (tracks ? 2 : 1) || parts[0] !== String(codes.length) || codes.length > 255) {
          fail(line, 'expected the next u8 ID');
        }
        if (codes.some((code) => code.name === name)) fail(line, `duplicate code ${name}`);
        codes.push({ name, id: Number(parts[0]), tracks });
      }
      return;
    }
    if (section === 'writes') {
      if (!body) return;
      const [name, languages, stateSpec, ...fields] = body.split(/\s+/);
      const langs = languages?.split(',');
      if (!/^[a-z][A-Za-z0-9]*$/.test(name) || !langs?.every((lang) => ['ts', 'swift', 'kotlin'].includes(lang)) || !fields.length) {
        fail(line, 'expected writer name, languages, dirty bits and fields');
      }
      if (writes.some((write) => write.name === name)) fail(line, `duplicate writer ${name}`);
      const [states, stamp, extra] = stateSpec.split('@');
      const match = stamp && /^(margin|padding|inset|size):([1-9]\d*)$/.exec(stamp);
      const physical = match ? { group: match[1], mask: Number(match[2]) } : undefined;
      if (stamp !== undefined && (!physical || extra !== undefined || !langs.includes('ts') ||
        physical.mask > (physical.group === 'size' ? 63 : 15))) {
        fail(line, 'expected a TypeScript physical group and mask after @');
      }
      const [mode, dirtyBits, extraMode] = states.includes(':') ? states.split(':') : [null, states];
      if (mode !== null && (extraMode !== undefined || !['text', 'transform', 'corner'].includes(mode))) fail(line, `invalid writer mode ${mode}`);
      writes.push({ name, langs, mode, physical, states: dirtyBits.split(','), fields, line });
      return;
    }
    if (section === 'accessors') {
      if (!body) return;
      const [name, writer, ...projections] = body.split(/\s+/);
      if (!/^[a-z][A-Za-z0-9]*$/.test(name) || !writer || !projections.length) {
        fail(line, 'expected a property, a writer and a language projection');
      }
      for (const projection of projections) {
        const match = /^(swift|kotlin|ts)=([a-z]+),([\w.]+)(?:,([\w.,=-]+))?$/.exec(projection);
        if (!match) fail(line, `invalid accessor projection ${projection}`);
        const [, lang, shape, type, flags = ''] = match;
        const parts = flags ? flags.split(',') : [];
        if (parts.some((flag) => !ACCESSOR_FLAGS.has(flag) && !/^(compat|fallback|input|invalid)=[\w-]+$/.test(flag))) {
          fail(line, `invalid accessor flags ${flags}`);
        }
        if (accessors.some((entry) => entry.name === name && entry.lang === lang)) fail(line, `duplicate ${lang} accessor ${name}`);
        accessors.push({ name, writer, lang, shape, type, flags: new Set(parts), comment, line });
      }
      return;
    }
    if (section === 'length_setters') {
      if (!body) return;
      const [name, writer, kind, ...projections] = body.split(/\s+/);
      if (!/^set[A-Z]\w*$/.test(name) || !Object.hasOwn(NATIVE_LENGTHS, kind) || !projections.length) {
        fail(line, 'expected a setter, writer, length kind and native projections');
      }
      for (const projection of projections) {
        const match = /^(swift|kotlin)=([a-zA-Z]\w*(?:\.(?:width|height))?)$/.exec(projection);
        if (!match) fail(line, `invalid length setter projection ${projection}`);
        const [, lang, target] = match;
        if (lengthSetters.some((entry) => entry.name === name && entry.lang === lang)) fail(line, `duplicate ${lang} setter ${name}`);
        lengthSetters.push({ name, writer, kind, lang, target, line });
      }
      return;
    }
    if (section === 'keywords') {
      if (!body) return;
      const [names, ...entries] = body.split(/\s+/);
      const properties = names.split(',');
      if (!entries.length || new Set(properties).size !== properties.length || properties.some((name) =>
        !/^[a-z][a-z0-9-]*$/.test(name) || keywords.some((entry) => entry.properties.includes(name)))) {
        fail(line, 'expected distinct CSS properties and keyword codes');
      }
      const values = new Map();
      for (const entry of entries) {
        const match = /^([a-z][a-z0-9+-]*)=(-?\d+)(?:\/(-?\d+|_))?(?:@(\d+),(\d+)(?:,(ts=\d+|kotlin))?|~(-?\d+))?$/.exec(entry);
        if (!match) fail(line, `invalid keyword entry ${entry}`);
        const [, word, rawCode, rawHtml, rawBase, rawMode, platform, rawReadAlias] = match;
        const keyword = word.replaceAll('+', ' ');
        const code = Number(rawCode);
        const html = rawHtml === '_' ? null : rawHtml === undefined ? code : Number(rawHtml);
        if ([code, html].some((n) => n !== null && (n < -2147483648 || n > 2147483647)) || values.has(keyword)) {
          fail(line, `duplicate keyword or out-of-range style code ${entry}`);
        }
        const display = rawBase === undefined ? undefined : {
          base: Number(rawBase), mode: Number(rawMode),
          tsBase: platform?.startsWith('ts=') ? Number(platform.slice(3)) : Number(rawBase),
          kotlinOnly: platform === 'kotlin',
        };
        if (display && (names !== 'display' || [display.base, display.tsBase, display.mode, code].some((n) => n < 0 || n > 127))) {
          fail(line, 'display values need signed-byte codes, bases, and modes');
        }
        const readAlias = rawReadAlias === undefined ? undefined : Number(rawReadAlias);
        if (readAlias !== undefined && (readAlias < -128 || readAlias > 255)) fail(line, 'a keyword read alias needs a byte code');
        values.set(keyword, { code, html, display, readAlias });
      }
      keywords.push({ properties, values });
      return;
    }
    const list = section === 'style' ? style : section === 'state' ? state : null;
    if (!list) return;
    // Blank lines and whole-line comments become section breaks in the output.
    if (!body) {
      list.push({ kind: comment ? 'comment' : 'blank', text: comment });
      return;
    }
    const tokens = body.split(/\s+/);
    const name = tokens.shift();
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) fail(line, `bad name "${name}"`);

    if (section === 'style') {
      const type = tokens.shift();
      const bytes = /^bytes\((\d+)\)$/.exec(type ?? '');
      const size = bytes ? Number(bytes[1]) : SIZES[type];
      if (!size) fail(line, `${name}: unknown type "${type}"`);
      let rustOwned = false;
      for (const t of tokens) {
        if (t === 'rust_owned') {
          rustOwned = true;
          continue;
        }
        const pin = /^@(\d+)$/.exec(t);
        if (!pin) fail(line, `${name}: unexpected "${t}"`);
        const at = Number(pin[1]);
        if (at < offset) fail(line, `${name}: @${at} overlaps the previous field (next free byte is ${offset})`);
        offset = at;
      }
      style.push({ kind: 'field', name, type, size, offset, comment, line, rustOwned });
      offset += size;
    } else {
      const names = {};
      for (const t of tokens) {
        const pin = /^@(\d+)$/.exec(t);
        if (pin) {
          if (Number(pin[1]) < bit) fail(line, `${name}: @${pin[1]} reuses an earlier bit`);
          bit = Number(pin[1]);
          continue;
        }
        const rename = /^(\w+)=(-|\w+)$/.exec(t);
        if (!rename || !LANGS.includes(rename[1])) fail(line, `${name}: unexpected "${t}"`);
        names[rename[1]] = rename[2];
      }
      if (bit > 127) fail(line, `${name}: bit ${bit} does not fit the 128-bit mask`);
      state.push({ kind: 'bit', name, bit, names, comment, line });
      bit += 1;
    }
  });

  const seen = new Map();
  for (const entry of [...style, ...state]) {
    if (!entry.name) continue;
    const key = `${entry.kind}:${entry.name}`;
    if (seen.has(key)) fail(entry.line, `${entry.name} is already defined on line ${seen.get(key)}`);
    seen.set(key, entry.line);
  }

  const fieldsByName = new Map(style.map((field) => [field.name, field]));
  const statesByName = new Map(state.map((entry) => [entry.name, entry]));
  const declaredGroups = new Map();
  for (const group of stateGroups) {
    if (statesByName.has(group.name)) fail(group.line, `dirty group ${group.name} conflicts with a dirty bit`);
    group.bits = new Set();
    for (const member of group.members) {
      if (member.startsWith('@')) {
        const included = declaredGroups.get(member.slice(1));
        if (!included) fail(group.line, `unknown or forward dirty group reference ${member}`);
        for (const bit of included.bits) group.bits.add(bit);
        continue;
      }
      const [start, end = start, extra] = member.split('..');
      const first = statesByName.get(start)?.bit;
      const last = statesByName.get(end)?.bit;
      if (first == null || last == null || first > last || extra !== undefined) fail(group.line, `invalid dirty bit or range ${member}`);
      for (const entry of state) {
        if (entry.bit >= first && entry.bit <= last) group.bits.add(entry.bit);
      }
    }
    declaredGroups.set(group.name, group);
  }
  const layout = declaredGroups.get('LAYOUT_MASK');
  const paint = declaredGroups.get('PAINT_ONLY');
  if (layout && paint) {
    for (const entry of state) {
      if (entry.kind === 'bit' && layout.bits.has(entry.bit) === paint.bits.has(entry.bit)) {
        fail(entry.line, `${entry.name} must belong to exactly one of LAYOUT_MASK and PAINT_ONLY`);
      }
    }
  }
  for (const record of records) {
    const revision = fieldsByName.get(record.revision);
    if (revision?.type !== 'u32' && revision?.type !== 'u8') fail(record.line, `invalid revision field ${record.revision}`);
    if (!recordLayouts.some((layout) => layout.name === record.layout)) fail(record.line, `unknown record layout ${record.layout}`);
    revision.rustOwned = true;
    record.byteRevision = revision.type === 'u8';
  }
  for (const write of writes) {
    write.fields = write.fields.map((name) => {
      const field = fieldsByName.get(name);
      if (!field || !WRITER_TYPES[field.type] || field.rustOwned) fail(write.line, `invalid writer field ${name}`);
      return field;
    });
    write.states = write.states.map((name) => {
      const entry = statesByName.get(name);
      if (!entry || !write.langs.every((lang) => stateName(entry, lang))) fail(write.line, `invalid writer dirty bit ${name}`);
      return entry;
    });
    if (write.mode === 'corner') {
      if (write.states.length !== 1 || write.states[0].name !== 'BORDER_RADIUS'
        || write.fields.some(({ name, type }) => type !== 'f32' || !/^BORDER_RADIUS_(TOP|BOTTOM)_(LEFT|RIGHT)_EXPONENT$/.test(name))) {
        fail(write.line, 'corner writers need exponent fields and the border radius dirty bit');
      }
    }
  }
  const writesByName = new Map(writes.map((write) => [write.name, write]));
  for (const entry of layoutMath) {
    const { target, line } = entry;
    const writer = writesByName.get(target);
    if (writer) {
      if (writer.fields.map(({ type }) => type.replace('i8', 'u8')).join(',') !== 'u8,f32' || writer.states.length !== 1) {
        fail(line, 'layout math needs a byte type, float value and one dirty bit');
      }
      [entry.type, entry.value] = writer.fields.map(({ name }) => name);
      entry.state = stateName(writer.states[0], 'ts');
      if (writer.physical) {
        const { group, mask } = writer.physical;
        entry.physical = { order: `${group.toUpperCase()}_ORDER`, length: group === 'size' ? 12 : 8, mask };
      }
      continue;
    }
    const [type, value, order, index, bit, extra] = target.split(',');
    const typeField = fieldsByName.get(type);
    const valueField = fieldsByName.get(value);
    const orderField = fieldsByName.get(order);
    const slot = Number(index);
    if (!['u8', 'i8'].includes(typeField?.type) || valueField?.type !== 'f32' || !orderField?.type?.startsWith('bytes(')
      || !Number.isInteger(slot) || slot < orderField.size / 2 || slot >= orderField.size || !statesByName.has(bit) || extra) {
      fail(line, 'logical layout math needs a valid type, value, order slot and dirty bit');
    }
    Object.assign(entry, { type, value, state: stateName(statesByName.get(bit), 'ts'), logical: { order, slot } });
  }
  const nativeAccessor = (name, lang) => accessors.find((accessor) => accessor.name === name && accessor.lang === lang);
  for (const accessor of accessors) {
    const { writer, shape, lang, flags, line } = accessor;
    const write = writesByName.get(writer);
    const count = ['font', 'spacing', 'limit', 'positionpair', 'decoration', 'corner'].includes(shape)
      ? write?.fields.length : (Object.hasOwn(ACCESSOR_FIELDS, shape) ? ACCESSOR_FIELDS[shape] : 0);
    const readOnly = flags.has('readonly');
    const sideRecord = flags.has('side-record');
    if (!count || !write || (!readOnly && !sideRecord && !write.langs.includes(lang)) || write.fields.length < count) fail(line, `invalid ${lang} binding to ${writer}`);
    if (readOnly && (lang === 'ts' || shape !== 'scalar' || write.fields.length !== 1 || !flags.has('internal'))) {
      fail(line, 'a read-only binding needs one native internal scalar');
    }
    accessor.write = write;
    accessor.fields = write.fields.slice(0, count);
    accessor.constants = write.fields.slice(count).map(({ name, type }) => {
      if (type !== 'u8' || !/_(STATE|TYPE)$/.test(name)) fail(line, `no typed accessor value for ${name}`);
      return name.endsWith('_STATE') ? 'StyleState.SET' : '0';
    });
    if (PAIRED_ACCESSORS.has(shape) && accessor.fields.some(({ type }, index) => index % 2 ? type !== 'f32' : type !== 'u8')) {
      fail(line, 'paired values need u8 types and f32 values');
    }
    if (ENUM_ACCESSORS.has(shape) && accessor.fields.some(({ type }) => type !== 'u8')) fail(line, 'enum bindings need u8 values');
    if (['colorrect', 'cssbordercolor'].includes(shape) && accessor.fields.some(({ type }) => type !== 'u32')) fail(line, 'color rectangles need u32 values');
    if (shape === 'nan' && accessor.fields[0].type !== 'f32') fail(line, 'NaN sentinel bindings need an f32 value');
    if (shape === 'positionpair') {
      const types = { ts: 'string', swift: 'MasonLengthPercentage', kotlin: 'String' };
      if (accessor.name !== writer || !['transformOrigin', 'objectPosition'].includes(writer)
        || (writer === 'objectPosition' && lang !== 'ts') || accessor.type !== types[lang] || flags.size
        || write.fields.map(({ type }) => type).join() !== 'u8,u8,f32,f32,u8' || !write.fields[4].name.endsWith('_STATE')) {
        fail(line, 'a position pair needs two units, two offsets and a state byte');
      }
    } else if (shape === 'decoration') {
      const { writer: expected, types } = DECORATION_BINDINGS[accessor.name] ?? {};
      const type = lang === 'ts' ? (writer === 'decorationThickness' ? 'number' : 'string') : 'String';
      if (expected !== writer || accessor.type !== type || flags.size
        || (writer === 'decorationThickness' && lang !== 'ts') || write.fields.map(({ type }) => type).join() !== types) {
        fail(line, 'a text decoration binding needs the matching value and state fields');
      }
    } else if (shape === 'font') {
      const types = FONT_BINDINGS[writer];
      const fields = writer === 'fontStyle' ? 'u8,u8,i32' : writer === 'fontSize' ? 'f32,u8,u8' : 'i32,u8';
      if (accessor.name !== writer || !types || accessor.type !== types[lang] || flags.size
        || write.fields.map(({ type }) => type).join() !== fields
        || !write.fields[1].name.endsWith('_STATE')) fail(line, 'a font projection needs its value and state fields');
      if (writer === 'fontStyle') {
        accessor.keywords = keywords.find(({ properties }) => properties.includes('font-style'))?.values;
        if (!accessor.keywords?.has('normal')) fail(line, 'font style needs its CSS keyword table');
      }
    } else if (shape === 'spacing') {
      const fields = writer === 'lineHeight' ? 'f32,u8,u8' : 'f32,u8';
      if (lang !== 'ts' || accessor.name !== writer || !['lineHeight', 'letterSpacing'].includes(writer)
        || accessor.type !== 'CoreTypes.LengthType' || flags.size || write.fields.map(({ type }) => type).join() !== fields
        || !write.fields[1].name.endsWith('_STATE')) fail(line, 'a spacing binding needs its value and state fields');
    } else if (shape === 'limit') {
      if (lang !== 'ts' || accessor.name !== writer || writer !== 'lineClamp' || accessor.type !== 'number' || flags.size
        || write.fields.map(({ type }) => type).join() !== 'i32,u8' || !write.fields[1].name.endsWith('_STATE')) {
        fail(line, 'a line count binding needs an integer value and a state field');
      }
    } else if (shape === 'textlength') {
      const types = { ts: writer === 'textIndent' ? 'TextIndent' : 'WordSpacing', swift: 'MasonLengthPercentage', kotlin: 'String' };
      if (accessor.name !== writer || !['textIndent', 'wordSpacing'].includes(writer) || (writer === 'wordSpacing' && lang !== 'ts')
        || accessor.type !== types[lang] || flags.size || write.fields.map(({ type }) => type).join() !== 'f32,u8,u8'
        || !write.fields[2].name.endsWith('_STATE')) fail(line, 'a text length needs a value, unit and state');
    } else if (shape === 'vertical') {
      accessor.keywords = keywords.find(({ properties }) => properties.includes('vertical-align'))?.values;
      if (accessor.name !== writer || writer !== 'verticalAlign' || !accessor.keywords || flags.size
        || accessor.type !== (lang === 'swift' ? 'MasonVerticalAlignValue' : 'VerticalAlign')
        || write.fields.map(({ type }) => type).join() !== 'f32,u8,u8') fail(line, 'vertical alignment needs an offset, percent flag and keyword');
    } else if (shape === 'bitset') {
      if (lang === 'ts' || (lang === 'kotlin' && accessor.type !== 'Int') || flags.size
        || write.fields.map(({ type }) => type).join() !== 'u8,u8' || !write.fields[1].name.endsWith('_STATE')) {
        fail(line, 'a native bitset needs one unsigned byte and its state');
      }
    } else if (shape === 'color') {
      const background = writer === 'backgroundColor';
      if (lang !== 'ts' || flags.size || accessor.type !== 'number'
        || (background ? accessor.name !== writer : accessor.name !== 'color' || writer !== 'fontColor')
        || write.fields.map(({ type }) => type).join() !== (background ? 'u32,u8,u8' : 'u32,u8')
        || !write.fields[1].name.endsWith('_STATE')) fail(line, 'a color binding needs a color and its state');
    } else if (shape === 'corner') {
      const corners = ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_RIGHT', 'BOTTOM_LEFT'];
      const fields = corners.filter((corner) => accessor.name === 'cornerShape' || accessor.name === camel(`CORNER_SHAPE_${corner}`));
      if (flags.size || accessor.name !== writer || accessor.type !== (lang === 'ts' ? 'string' : 'String')
        || write.mode !== 'corner' || !fields.length
        || write.fields.map(({ name }) => name).join() !== fields.map((corner) => `BORDER_RADIUS_${corner}_EXPONENT`).join()) {
        fail(line, 'a corner binding needs the matching exponent fields');
      }
    } else if (shape === 'boxsides') {
      const { group, mask } = write.physical ?? {};
      const expected = ['top', 'right', 'bottom', 'left'].flatMap((side) => ['TYPE', 'VALUE'].map((suffix) => `${writer.toUpperCase()}_${side.toUpperCase()}_${suffix}`));
      if (lang !== 'ts' || writer !== accessor.name || !['inset', 'margin', 'padding'].includes(writer)
        || accessor.type !== (writer === 'padding' ? 'Length' : 'LengthAuto') || flags.size
        || group !== writer || mask !== 15 || write.states.length !== 1
        || write.fields.map(({ name }) => name).join() !== expected.join()) {
        fail(line, 'a box shorthand needs four physical side lengths and one dirty bit');
      }
    } else if (shape === 'borderside' || shape === 'borderstyles') {
      accessor.keywords = keywords.find(({ properties }) => properties.includes('border-style'))?.values;
      const shorthand = shape === 'borderstyles';
      const sides = ['Top', 'Right', 'Bottom', 'Left'];
      const expected = shorthand ? sides.map((side) => `BORDER_${side.toUpperCase()}_STYLE`)
        : [`BORDER_${writer.slice(6, -5).toUpperCase()}_STYLE`];
      if (lang !== 'ts' || flags.size || accessor.type !== 'string' || !accessor.keywords?.has('none')
        || (shorthand ? writer !== 'borderStyles' || accessor.name !== 'borderStyle'
          : accessor.name !== writer || !sides.some((side) => writer === `border${side}Style`))
        || write.fields.map(({ name }) => name).join() !== expected.join()) fail(line, 'border style needs the matching keyword fields');
    } else if (shape === 'cssbordercolor') {
      if (lang !== 'swift' || flags.size || accessor.type !== 'String' || accessor.name !== 'borderColor' || writer !== 'borderColors'
        || write.fields.map(({ name }) => name).join() !== 'BORDER_TOP_COLOR,BORDER_RIGHT_COLOR,BORDER_BOTTOM_COLOR,BORDER_LEFT_COLOR') {
        fail(line, 'border color needs four color fields');
      }
    } else if (shape === 'display') {
      accessor.keywords = keywords.find(({ properties }) => properties.includes('display'))?.values;
      const entries = [...accessor.keywords?.values() ?? []];
      if (writer !== 'display' || accessor.name !== 'display' || write.fields.length !== 2 || flags.size
        || accessor.type !== (lang === 'ts' ? 'literal' : 'Display')
        || !entries.length || entries.some(({ display }) => !display)
        || new Set(entries.map(({ code }) => code)).size !== entries.length
        || new Set(entries.map(({ display }) => `${display.base}/${display.mode}`)).size !== entries.length) {
        fail(line, 'display bindings need a distinct code and storage pair for each keyword');
      }
    } else if (lang === 'ts') {
      if (shape === 'nan') {
        if (writer !== 'aspectRatio' || accessor.type !== 'number' || write.fields.length !== 1 || flags.size) {
          fail(line, 'a TypeScript aspect-ratio binding needs one float');
        }
      } else if (shape === 'gap') {
        if (writer !== 'gap' || accessor.type !== 'string' || write.fields.map(({ type }) => type).join() !== 'u8,f32,u8,f32' || flags.size) {
          fail(line, 'a gap binding needs the row and column lengths');
        }
      } else if (shape === 'devicepoints') {
        if (accessor.type !== 'CoreTypes.LengthType' || write.fields.length !== 1 || accessor.fields[0].type !== 'f32' || flags.size) {
          fail(line, 'a device pixel binding needs one float');
        }
      } else if (shape === 'scalar') {
        if (accessor.type !== 'number' || write.fields.length !== 1 || !['i32', 'f32'].includes(accessor.fields[0].type)
          || [...flags].some((flag) => flag !== 'changed')) {
          fail(line, 'TypeScript scalars need one integer or float field');
        }
      } else if (shape === 'enumpoint') {
        accessor.property = cssProperty(accessor.name);
        accessor.keywords = keywords.find(({ properties }) => properties.includes(accessor.property))?.values;
        if (!accessor.keywords || flags.size || write.fields.length !== 2 || accessor.type !== 'OverFlow') {
          fail(line, 'TypeScript enum pairs need a keyword table and two byte fields');
        }
      } else if (shape === 'keyword') {
        accessor.property = cssProperty(writer);
        accessor.keywords = keywords.find(({ properties }) => properties.includes(accessor.property))?.values;
        accessor.fallback = accessorFlag(flags, 'fallback') ?? [...accessor.keywords ?? []].find(([, { code }]) => code === 0)?.[0];
        accessor.input = accessorFlag(flags, 'input') ?? (accessor.type === 'number' ? 'literal' : accessor.type);
        accessor.invalid = accessorFlag(flags, 'invalid');
        const codes = [...accessor.keywords?.values() ?? []].map(({ code }) => code);
        accessor.signed = codes.some((code) => code < 0);
        if (!accessor.keywords || !['string', 'literal', 'number', 'GridAutoFlow'].includes(accessor.type)
          || !['string', 'literal', 'GridAutoFlow'].includes(accessor.input) || !(accessor.fallback === 'undefined' || accessor.keywords.has(accessor.fallback))
          || write.fields.length > 2 || write.fields.some(({ type }) => type !== 'u8')
          || (write.fields.length === 2 && !write.fields[1].name.endsWith('_STATE'))
          || (flags.has('read-state') && write.fields.length !== 2)
          || (accessor.invalid && !['reset', 'notify'].includes(accessor.invalid))
          || (accessor.invalid === 'reset' && accessor.fallback === 'undefined')
          || (accessor.invalid === 'notify' && write.states.length !== 1)
          || (accessor.type === 'number' && (accessor.signed || !codes.includes(0) || Math.max(...codes) >= new Set(codes).size))
          || [...flags].some((flag) => !['read-state', 'changed'].includes(flag) && !/^(fallback|input|invalid)=/.test(flag))
          || codes.some((code) => code < (accessor.signed ? -128 : 0) || code > (accessor.signed ? 127 : 255))) {
          fail(line, 'TypeScript keyword bindings need a byte-sized keyword table and an optional state byte');
        }
      } else if (shape !== 'length' || !Object.hasOwn(TS_LENGTH_BINDINGS, accessor.type) || flags.size || write.fields.length !== 2) {
        fail(line, 'TypeScript length bindings need a supported length type');
      }
    }
    if (lang !== 'ts' && [...flags].some((flag) => flag === 'read-state' || /^(input|invalid)=/.test(flag))) {
      fail(line, 'this keyword option requires a TypeScript binding');
    }
    if (flags.has('decoded') && (lang === 'ts' || shape !== 'enum')) fail(line, 'an adapted binding needs a native enum');
    if (sideRecord && (lang === 'ts' || shape !== 'enum' || !flags.has('decoded'))) fail(line, 'a side record needs a decoded native enum');
    if (flags.has('pseudo') && (lang !== 'kotlin' || write.states.length !== 1)) fail(line, 'pseudo binding needs one Android dirty bit');
    if (flags.has('axis-pseudo') && (lang !== 'kotlin' || shape !== 'enumpoint' || write.states.length !== 2)) {
      fail(line, 'per-axis pseudo binding needs an Android enum pair and two dirty bits');
    }
    if (flags.has('inherit-zero') && (!write.fields[1]?.name.endsWith('_STATE') || lang !== 'kotlin')) fail(line, 'inherit-zero needs an Android state field');
    if (flags.has('changed') && !['enum', 'keyword'].includes(shape)
      && !(lang === 'ts' && shape === 'scalar') && !(lang === 'kotlin' && shape === 'length')) {
      fail(line, 'changed binding needs an enum or an Android length');
    }
    const compat = flags.has('compat') || accessorFlag(flags, 'compat');
    if (compat) {
      const binding = SWIFT_COMPAT[accessor.type]?.[shape];
      if (lang !== 'swift' || !binding) fail(line, 'unsupported Objective-C compatibility accessor');
      accessor.compat = typeof compat === 'string' ? compat : `${accessor.name}Compat`;
      if (!/^[a-z]\w*$/.test(accessor.compat) || nativeAccessor(accessor.compat, lang)
        || accessors.filter((entry) => entry.compat === accessor.compat).length > 1) {
        fail(line, 'duplicate or invalid Objective-C compatibility accessor');
      }
    }
  }
  for (const setter of lengthSetters) {
    const { writer, kind, lang, target, line } = setter;
    const write = writesByName.get(writer);
    if (!write?.langs.includes(lang) || ![2, 4, 8].includes(write.fields.length)
      || write.fields.some(({ type }, index) => type !== (index % 2 ? 'f32' : 'u8'))) {
      fail(line, 'length setter needs a native writer with type/value pairs');
    }
    setter.pairs = write.fields.length / 2;
    if (target === 'raw') continue;
    if (target === 'typed') {
      if (lang !== 'kotlin' || kind !== 'dimension' || setter.pairs !== 1) {
        fail(line, 'typed overloads need a single Android dimension writer');
      }
      continue;
    }
    const [property, axis] = target.split('.');
    const accessor = nativeAccessor(property, lang);
    const type = NATIVE_LENGTHS[kind][lang];
    const first = axis === 'height' ? 2 : 0;
    if (!accessor || accessor.type !== type
      || (axis && (lang !== 'swift' || accessor.shape !== 'size' || setter.pairs !== 1))
      || write.fields.length !== (axis ? 2 : accessor.fields.length)
      || write.fields.some((field, index) => field !== accessor.fields[first + index])) {
      fail(line, 'length setter target must match the writer fields and native type');
    }
  }
  const borderCorners = new Map();
  const borderStates = {};
  if (borderSides.length) {
    if (borderSides.length !== 4) fail(borderSides[0].line, 'expected all four physical border sides');
    const exponentWrite = writesByName.get('cornerShape');
    if (!exponentWrite || exponentWrite.fields.length !== 4) fail(borderSides[0].line, 'border sides need the four corner exponents');
    borderStates.radius = exponentWrite.states[0];
    for (const field of exponentWrite.fields) {
      const corner = cornerMember(field);
      const radius = writesByName.get(`border${capitalize(corner)}Radius`);
      if (!radius || radius.fields.map(({ type }) => type).join() !== 'u8,f32,u8,f32'
        || radius.states.length !== 1 || radius.states[0] !== borderStates.radius) {
        fail(borderSides[0].line, `missing corner radius writer for ${corner}`);
      }
      borderCorners.set(corner, { radius: radius.fields, exponent: field });
    }
    const colors = writesByName.get('borderColors');
    borderStates.color = colors?.states[0];
    for (const side of borderSides) {
      const name = capitalize(side.side);
      const width = writesByName.get(`border${name}Width`);
      const styleWrite = writesByName.get(`border${name}Style`);
      const color = colors?.fields.find((field) => field.name === `BORDER_${side.side.toUpperCase()}_COLOR`);
      if (width?.fields.map(({ type }) => type).join() !== 'u8,f32' || width.states.length !== 1
        || styleWrite?.fields.length !== 1 || styleWrite.fields[0].type !== 'u8' || styleWrite.states.length !== 1
        || color?.type !== 'u32' || colors.states.length !== 1) {
        fail(side.line, 'border side needs width, style and color writers');
      }
      borderStates.width ??= width.states[0];
      borderStates.style ??= styleWrite.states[0];
      if (width.states[0] !== borderStates.width || styleWrite.states[0] !== borderStates.style) {
        fail(side.line, 'border sides must share their width and style dirty bits');
      }
      side.fields = [...width.fields, ...styleWrite.fields, color];
      side.corners = side.corners.map(camel);
      if (side.corners.some((corner) => !borderCorners.has(corner))) fail(side.line, 'unknown border corner');
    }
  }
  if (layoutMath.length && layoutMathType === undefined) fail(layoutMath[0].line, 'missing layout expression type byte');
  return { style, state, stateGroups, writes, accessors, lengthSetters, layoutMath, layoutMathType, keywords, records, recordLayouts, filterOperations, cssParseKinds, cssMathProperties, gridProperties, borderSides, borderCorners, borderStates, bufferSize: Math.ceil(offset / 8) * 8 };
}

function rustKeywordLines(schema) {
  const stretch = schema.keywords.find(({ properties }) => properties.includes('font-stretch'));
  return [
    'fn lookup(property: &str, value: &str, native_html: bool) -> Option<i32> {',
    '    match property {',
    ...schema.keywords.flatMap(({ properties, values }) => [
      `        ${properties.map((name) => JSON.stringify(name)).join(' | ')} => match value {`,
      ...[...values].flatMap(([keyword, { code, html, display }]) => {
        if (display?.kotlinOnly) return [];
        const pattern = JSON.stringify(keyword);
        return html === code ? [`            ${pattern} => Some(${code}),`] : [
          `            ${pattern} if native_html => ${html === null ? 'None' : `Some(${html})`},`,
          `            ${pattern} => Some(${code}),`,
        ];
      }),
      '            _ => None,',
      '        },',
    ]),
    '        _ => None,',
    '    }',
    '}',
    '',
    'pub(super) fn font_stretch_name(code: i32) -> Option<&\'static str> {',
    '    match code {',
    ...[...stretch.values].map(([name, { code }]) => `        ${code} => Some(${JSON.stringify(name)}),`),
    '        _ => None,',
    '    }',
    '}',
  ];
}

const camel = (name) => name.toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const capitalize = (name) => name[0].toUpperCase() + name.slice(1);
const cssProperty = (name) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const accessorFlag = (flags, key) => [...flags].find((flag) => flag.startsWith(`${key}=`))?.slice(key.length + 1);
const pascal = (name) => camel(name).replace(/^./, (c) => c.toUpperCase());
// C++ uses kPascalCase: Win32 headers define SCREAMING macros (`OVERFLOW`, `FLOAT`).
const cppName = (name) => `k${pascal(name)}`;

function stateName(entry, lang) {
  const override = entry.names[lang];
  if (override === '-') return null;
  if (override) return override;
  if (lang === 'swift') return camel(entry.name);
  if (lang === 'cpp') return cppName(entry.name);
  return entry.name;
}

function stateGroupLines(schema, lang) {
  const wordSize = lang === 'cpp' || lang === 'ts' ? 32 : 64;
  const literal = (word) => '0x' + word.toString(16).padStart(wordSize / 4, '0');
  const kotlin = (word) => literal(word) + (word < (1n << 63n) ? 'L' : 'UL.toLong()');
  return schema.stateGroups.filter(({ langs }) => langs.includes(lang)).map(({ name, bits }) => {
    const words = Array(128 / wordSize).fill(0n);
    for (const bit of bits) words[Math.floor(bit / wordSize)] |= 1n << BigInt(bit % wordSize);
    if (lang === 'kotlin') return `val ${name} = StateKeys(${words.map(kotlin).join(', ')})`;
    if (lang === 'swift') return `static let ${camel(name)} = StateKeys(low: ${literal(words[0])}, high: ${literal(words[1])})`;
    if (lang === 'ts') return `static readonly ${name} = new StateKeys(${words.map((word) => BigInt.asIntN(32, word).toString()).join(', ')});`;
    return `inline constexpr std::array<uint32_t, 4> ${cppName(name)}{{ ${words.map((word) => literal(word) + 'u').join(', ')} }};`;
  });
}

const WRITER_TYPES = {
  u8: { ts: ['number', 'setUint8'], kotlin: ['Byte', 'put'], swift: ['UInt8', 'setUInt8'] },
  i8: { ts: ['number', 'setInt8'], kotlin: ['Byte', 'put'], swift: ['Int8', 'setInt8'] },
  i32: { ts: ['number', 'setInt32'], kotlin: ['Int', 'putInt'], swift: ['Int32', 'setInt32'] },
  u32: { ts: ['number', 'setUint32'], kotlin: ['Int', 'putInt'], swift: ['UInt32', 'setUInt32'] },
  f32: { ts: ['number', 'setFloat32'], kotlin: ['Float', 'putFloat'], swift: ['Float', 'setFloat'] },
};

const ACCESSOR_FIELDS = { scalar: 1, enum: 1, points: 1, nan: 1, keyword: 1, length: 2, point: 4, size: 4, rect: 8, enumpoint: 2, enumrect: 4, colorrect: 4, display: 2, textlength: 2, vertical: 3, bitset: 1, gap: 4, devicepoints: 1, color: 1, boxsides: 8, borderside: 1, borderstyles: 4, cssbordercolor: 4 };
const PAIRED_ACCESSORS = new Set(['length', 'point', 'size', 'rect', 'boxsides']);
const ENUM_ACCESSORS = new Set(['enum', 'enumrect', 'enumpoint', 'display', 'borderside', 'borderstyles']);
const FONT_BINDINGS = {
  fontSize: { ts: 'number' },
  fontStyle: { ts: 'string', swift: 'FontStyle', kotlin: 'FontStyle' },
  fontWeight: { ts: 'number', swift: 'String', kotlin: 'FontWeight' },
  fontStretch: { ts: 'string', kotlin: 'String' },
};
const DECORATION_BINDINGS = {
  textDecoration: { writer: 'textDecoration', types: 'u8,u8,u32,f32,u8,u8,u8,u8' },
  textDecorationLine: { writer: 'decorationLine', types: 'u8,u8', initial: 'none' },
  textDecorationStyle: { writer: 'decorationStyle', types: 'u8,u8', initial: 'solid' },
  textDecorationColor: { writer: 'decorationColor', types: 'u32,u8', initial: 'currentcolor' },
  textDecorationThickness: { writer: 'decorationThickness', types: 'f32,u8' },
};
const ACCESSOR_FLAGS = new Set(['pseudo', 'axis-pseudo', 'nonnegative', 'inherit-zero', 'dirty', 'marker', 'font-metrics', 'changed', 'internal', 'read-state', 'compat', 'decoded', 'readonly', 'side-record']);

const NATIVE_LENGTHS = {
  length: { swift: 'MasonLengthPercentage', kotlin: 'LengthPercentage', decode: 'getLengthPercentage' },
  auto: { swift: 'MasonLengthPercentageAuto', kotlin: 'LengthPercentageAuto', decode: 'getLengthPercentageAuto' },
  dimension: { swift: 'MasonDimension', kotlin: 'Dimension', decode: 'getDimension' },
};

const SWIFT_COMPAT = {
  MasonLengthPercentage: {
    rect: ['MasonLengthPercentageRectCompat', 'intoMasonRect'],
    size: ['MasonLengthPercentageSizeCompat', 'intoMasonSize'],
  },
  MasonLengthPercentageAuto: {
    rect: ['MasonLengthPercentageAutoRectCompat', 'intoMasonRect'],
  },
  MasonDimension: {
    size: ['MasonDimensionSizeCompat', 'intoMasonSize'],
    length: ['MasonDimensionCompat'],
  },
  Overflow: { enumpoint: ['MasonOverflowPointCompat'] },
};

function swiftCompatLines({ name, compat, shape, type }) {
  const [wrapper, convert] = SWIFT_COMPAT[type][shape];
  const declaration = `public var ${compat}: ${wrapper} {`;
  if (shape === 'length') return [
    declaration,
    `  get { ${wrapper}(value: ${name}) }`,
    `  set { ${name} = newValue.dimension }`,
    '}',
    '',
  ];
  if (shape === 'enumpoint') return [
    declaration,
    `  get { ${wrapper}(${name}X, ${name}Y) }`,
    `  set { ${name} = MasonPoint(newValue.x, newValue.y) }`,
    '}',
    '',
  ];
  return [
    declaration,
    `  get { ${wrapper}(${name}) }`,
    `  set { ${name} = newValue.${convert}() }`,
    '}',
    '',
  ];
}

function lengthSetterLines({ lengthSetters }, lang) {
  return lengthSetters.filter((entry) => entry.lang === lang).flatMap(({ name, writer, kind, target, pairs }) => {
    const method = `write${writer[0].toUpperCase()}${writer.slice(1)}`;
    const { kotlin: type, decode } = NATIVE_LENGTHS[kind];
    const input = (property, expr, prefix) => {
      if (pairs === 4) return `${property} = ${prefix ? `MasonRect(uniform: ${expr})` : `Rect.uniform(${expr})`}`;
      if (pairs === 2) return `${property} = ${prefix}Size(${expr}, ${expr})`;
      const [size, axis] = property.split('.');
      if (axis === 'width') return `${size} = MasonSize(${expr}, ${size}.height)`;
      if (axis === 'height') return `${size} = MasonSize(${size}.width, ${expr})`;
      return `${property} = ${expr}`;
    };
    if (lang === 'swift') {
      const raw = Array(pairs).fill('UInt8(bitPattern: length.type), length.value').join(', ');
      return [
        `public func ${name}(_ value: Float, _ type: Int) {`,
        `  guard let length = ${decode}(value, type) else { return }`,
        `  ${target === 'raw' ? `${method}(${raw})` : input(target, 'length', 'Mason')}`,
        '}',
        '',
      ];
    }
    const raw = target === 'raw' || target === 'typed';
    const fields = Array(pairs).fill('type, value').join(', ');
    return [
      `fun ${name}(value: Float, type: Byte) {`,
      raw
        ? `  if (${type}.isValid(type, value)) ${method}(${fields})`
        : `  ${type}.fromTypeValue(type, value)?.let { ${input(target, 'it', '')} }`,
      '}',
      '',
      ...(target === 'typed' ? [
        `fun ${name}(value: ${type}) {`,
        `  ${method}(value.type, value.value)`,
        '}',
        '',
      ] : []),
    ];
  });
}
const TS_LENGTH_BINDINGS = {
  DimensionLength: { kind: 'dimension', read: 'parseDimension' },
  LengthAuto: { kind: 'auto', read: 'parseLengthPercentageAuto' },
  Length: { kind: 'length', read: 'parseLengthPercentage' },
};

function displayAccessorLines({ lang, keywords, fields, write }, collapse) {
  const [baseKey, modeKey] = fields.map(({ name }) => `StyleKeys.${name}`);
  const entries = [...keywords].filter(([, { display }]) => !display.kotlinOnly || lang === 'kotlin');
  const modes = new Map();
  for (const [keyword, { display }] of entries) {
    if (display.mode === 0) continue;
    if (!modes.has(display.mode)) modes.set(display.mode, []);
    modes.get(display.mode).push({ keyword, ...display });
  }
  if (lang === 'ts') {
    const type = entries.map(([keyword]) => `'${keyword}'`).join(' | ');
    const special = [...modes].flatMap(([mode, values]) => values.length === 1
      ? [`  if (mode === ${mode}) return '${values[0].keyword}';`]
      : values.map(({ keyword, tsBase }) => `  if (mode === ${mode} && base === ${tsBase}) return '${keyword}';`));
    return [
      `get display(): ${type} {`,
      `  const base = getInt8(this.style_view, ${baseKey});`,
      `  const mode = getInt8(this.style_view, ${modeKey});`,
      ...special,
      '  switch (base) {',
      ...entries.filter(([, { display }]) => display.mode === 0).map(([keyword, { display }]) => `    case ${display.tsBase}: return '${keyword}';`),
      "    default: return 'none';",
      '  }',
      '}',
      `set display(value: ${type}) {`,
      "  switch (cssKeywordCode('display', value)) {",
      ...entries.map(([, { code, display }]) => `    case ${code}: this.writeDisplay(${display.tsBase}, ${display.mode}); break;`),
      '  }',
      '}',
      '',
    ];
  }
  const swift = lang === 'swift';
  const nativeCase = (keyword) => keyword.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
  const nativeValue = (keyword) => `${swift ? '' : 'Display'}.${nativeCase(keyword)}`;
  const base = swift ? `getInt8(${baseKey})` : `buffer.get(${baseKey}).toInt()`;
  const mode = swift ? `getInt8(${modeKey})` : `buffer.get(${modeKey}).toInt()`;
  const cases = [...modes].flatMap(([id, values]) => values.length === 1
    ? [swift ? `case (_, ${id}): return ${nativeValue(values[0].keyword)}` : `mode == ${id} -> ${nativeValue(values[0].keyword)}`]
    : values.map(({ keyword, base }) => swift ? `case (${base}, ${id}): return ${nativeValue(keyword)}`
      : `mode == ${id} && base == ${base} -> ${nativeValue(keyword)}`));
  const input = swift ? 'newValue' : 'value';
  const setters = entries.map(([keyword, { display }]) => {
    const call = `writeDisplay(${display.base}, ${display.mode})`;
    return swift ? `case ${nativeValue(keyword)}: ${call}` : `${nativeValue(keyword)} -> ${call}`;
  });
  if (swift) return [
    'public var display: Display {',
    '  get {',
    `    if visibilityCode == ${collapse} { return .None }`,
    `    switch (${base}, ${mode}) {`,
    '    case (let base, 0): return Display(rawValue: base)!',
    ...cases.map((line) => `    ${line}`),
    '    default: preconditionFailure("Invalid display encoding")',
    '    }',
    '  }',
    '  set {',
    `    switch ${input} {`,
    ...setters.map((line) => `    ${line}`),
    '    }',
    `    updateDisplayVisibility(${input})`,
    '  }',
    '}',
    '',
  ];
  return [
    'private fun readDisplayFrom(buffer: ByteBuffer): Display {',
    `  val base = ${base}`,
    `  val mode = ${mode}`,
    '  return when {',
    '    mode == 0 -> Display.from(base.toByte())',
    ...cases.map((line) => `    ${line}`),
    '    else -> error("Invalid display encoding")',
    '  }',
    '}',
    '',
    'var display: Display',
    '  get() {',
    `    if (visibilityCode == ${collapse}.toByte()) return Display.None`,
    `    return resolvePseudo(StateKeys.${stateName(write.states[0], lang)}, readDisplayFrom(values), ::readDisplayFrom)`,
    '  }',
    '  set(value) {',
    `    when (${input}) {`,
    ...setters.map((line) => `      ${line}`),
    '    }',
    `    updateDisplayVisibility(${input})`,
    '  }',
    '',
  ];
}

function textLengthAccessorLines({ name, lang, type, write, comment }, method) {
  const [value, unit, state] = write.fields.map(({ name }) => `StyleKeys.${name}`);
  if (lang === 'swift') return [
    `/// ${comment}`,
    `public var ${name}: ${type} {`,
    '  get {',
    `    let amount = getFloat(${value})`,
    `    return getUInt8(${unit}) == 1 ? .Percent(amount / 100) : .Points(amount)`,
    '  }',
    '  set {',
    '    switch newValue {',
    `    case .Points(let value): ${method}(value, 0, StyleState.SET)`,
    `    case .Percent(let value): ${method}(value * 100, 1, StyleState.SET)`,
    `    case .Zero: ${method}(0, 0, StyleState.SET)`,
    '    }',
    '  }',
    '}',
    '',
  ];
  if (lang === 'kotlin') return [
    `/** ${comment} */`,
    `var ${name}: ${type}`,
    '  get() {',
    `    if (values.get(${state}) == StyleState.INHERIT) return "0px"`,
    `    val amount = values.getFloat(${value})`,
    `    return if (values.get(${unit}).toInt() == 1) "\${cssNumber(amount)}%"`,
    '    else "${cssNumber(amount / node.mason.scale)}px"',
    '  }',
    '  set(value) {',
    `    val fields = ${name}Fields(value) ?: return`,
    `    setResolved${name[0].toUpperCase()}${name.slice(1)}(fields[CssLengthResultRecord.VALUE].toFloat(), fields[CssLengthResultRecord.KIND] == 2.0)`,
    '  }',
    '',
  ];
  const indent = type === 'TextIndent';
  const unset = indent ? '0px' : 'normal';
  return [
    `get ${name}(): string {`,
    `  if (!this.style_view || !getUint8(this.style_view, ${state})) return '${unset}';`,
    `  const unit = getUint8(this.style_view, ${unit});`,
    ...(indent ? [] : ["  if (unit === 2) return 'normal';"]),
    `  const amount = getFloat32(this.style_view, ${value});`,
    `  return unit === 1 ? \`\${amount}%\` : \`\${${indent ? 'layout.toDeviceIndependentPixels(amount)' : 'amount'}}px\`;`,
    '}',
    `set ${name}(value: string | number) {`,
    '  if (!this.style_view) return;',
    '  if (typeof value === \'number\') {',
    `    this.${method}(layout.toDevicePixels(value), 0, 1);`,
    '    return;',
    '  }',
    `  const css = ${indent ? "String(value ?? '')" : 'value'};`,
    `  const fields = nativeCssLength(css, CssParseKind.${type}, ...numericCssContext(css, this.emBasisFor(css)));`,
    '  if (!fields) return;',
    '  const [kind, amount] = fields;',
    `  this.${method}(${indent ? 'kind === 2 ? amount * 100 : amount, kind === 2 ? 1 : 0' : 'amount, kind'}, 1);`,
    '}',
    '',
  ];
}

function verticalAccessorLines({ lang, type, fields, keywords }, method) {
  const [value, unit, keyword] = fields.map(({ name }) => `StyleKeys.${name}`);
  if (lang === 'swift') return [
    `public var verticalAlign: ${type} {`,
    `  get { ${type}(storedOffset: getFloat(${value}), isPercent: getUInt8(${unit}) == 1, kind: getUInt8(${keyword})) }`,
    `  set { ${method}(newValue.offset, newValue.isPercent ? 1 : 0, UInt8(newValue.align.rawValue)) }`,
    '}',
    '',
  ];
  if (lang === 'kotlin') return [
    `var verticalAlign: ${type}`,
    `  get() = ${type}.fromTypeValue(values.get(${keyword}), values.get(${unit}).toInt() == 1, values.getFloat(${value}))`,
    '    ?: throw IllegalArgumentException("Invalid vertical-align value")',
    '  set(value) {',
    '    when (value) {',
    `      ${type}.Length -> ${method}(value.value, 0, 0)`,
    `      ${type}.Percent -> ${method}(value.value, 1, 0)`,
    `      else -> ${method}(0f, 0, value.type)`,
    '    }',
    '  }',
    '',
  ];
  return [
    'get verticalAlign() {',
    `  const amount = getFloat32(this.style_view, ${value});`,
    `  if (getUint8(this.style_view, ${unit}) === 1) return \`\${amount * 100}%\`;`,
    '  if (amount !== 0) return `${layout.toDeviceIndependentPixels(amount)}px`;',
    `  switch (getUint8(this.style_view, ${keyword})) {`,
    ...[...keywords].filter(([name]) => name !== 'baseline').map(([name, { code }]) => `    case ${code}: return '${name}';`),
    "    default: return 'baseline';",
    '  }',
    '}',
    `set verticalAlign(value: ${type}) {`,
    "  if (typeof value === 'string') {",
    '    const fields = nativeCssLength(value, CssParseKind.VerticalAlign, ...numericCssContext(value, this.emBasisFor(value)));',
    '    if (!fields) return;',
    '    const [kind, amount] = fields;',
    `    this.${method}(kind === 3 ? 0 : amount, kind === 2 ? 1 : 0, kind === 3 ? amount : 0);`,
    "  } else if (typeof value === 'number') {",
    `    if (Number.isFinite(value)) this.${method}(layout.toDevicePixels(value), 0, 0);`,
    '  } else if (value && Number.isFinite(value.value)) {',
    `    if (value.unit === '%') this.${method}(value.value, 1, 0);`,
    `    else if (value.unit === 'px' || value.unit === 'dip') this.${method}(layout.toDevicePixels(value.value), 0, 0);`,
    '  }',
    '}',
    '',
  ];
}

function bitsetAccessorLines({ name, lang, type, write }, method) {
  const [value, state] = write.fields.map(({ name }) => `StyleKeys.${name}`);
  return lang === 'swift' ? [
    `public var ${name}: ${type} {`,
    `  get { ${type}(rawValue: getUInt8(${value})) }`,
    '  set {',
    `    if newValue != ${name} || getUInt8(${state}) != StyleState.SET {`,
    `      ${method}(newValue.rawValue, StyleState.SET)`,
    '    }',
    '  }',
    '}',
    '',
  ] : [
    `var ${name}: ${type}`,
    `  get() = values.get(${value}).toInt() and 0xFF`,
    '  set(value) {',
    `    if (value != ${name} || values.get(${state}) != StyleState.SET) {`,
    `      ${method}(value.toByte(), StyleState.SET)`,
    '    }',
    '  }',
    '',
  ];
}

function fontAccessorLines({ name, lang, type, fields, keywords }, method) {
  const [value, state, extra] = fields.map(({ name }) => `StyleKeys.${name}`);
  if (name === 'fontSize') return [
    'get fontSize() {',
    '  if (!this.style_view) return 16;',
    `  const unit = getUint8(this.style_view, ${extra});`,
    `  const size = getFloat32(this.style_view, ${value});`,
    '  return unit === 1 ? `${size / 100}%` as never : size;',
    '}',
    "set fontSize(value: string | number | { value: number; unit: 'dip' | 'px' | '%' }) {",
    '  if (!this.style_view) return;',
    '  switch (typeof value) {',
    "    case 'string': {",
    '      const fields = resolveLengthInRust(value, isCssMathFunction(value.trim()) ? this.parentEmBasis() : undefined, true);',
    '      if (!fields) break;',
    '      const [kind, amount] = fields;',
    `      this.${method}(kind === 2 ? amount * 100 : kind === 1 ? layout.toDeviceIndependentPixels(amount) : amount, 1, kind === 2 ? 1 : 0);`,
    '      break;',
    '    }',
    "    case 'number':",
    `      this.${method}(value, 1, 0);`,
    '      break;',
    "    case 'object':",
    `      if (value.unit === 'dip' || value.unit === 'px') this.${method}(finite(value.value), 1, 0);`,
    `      else if (value.unit === '%') this.${method}(value.value * 100, 1, 1);`,
    '      break;',
    '  }',
    '}',
    '',
  ];
  if (name === 'fontStyle') {
    if (lang === 'swift') return [
      `public var ${name}: ${type} {`,
      `  get { ${type}(rawValue: getInt8(${value})) ?? ${type}(fontStyle: font.fontDescriptors.style) }`,
      '  set { setFontStyle(newValue, 0) }',
      '}',
      '',
    ];
    if (lang === 'kotlin') return [
      `private fun readFontStyle(buffer: ByteBuffer): ${type} = decodeFontStyle(buffer.get(${value}), buffer.getInt(${extra}))`,
      '',
      `var ${name}: ${type}`,
      '  get() = readFontStyle(values)',
      '  set(value) = applyFontStyle(value)',
      '',
    ];
    return [
      'get fontStyle() {',
      "  if (!this.style_view) return 'normal';",
      `  switch (getInt8(this.style_view, ${value})) {`,
      ...[...keywords].filter(([name]) => name !== 'normal').map(([name, { code }]) => `    case ${code}: return '${name}';`),
      "    default: return 'normal';",
      '  }',
      '}',
      `set fontStyle(value: ${type}) {`,
      "  if (!this.style_view || typeof value !== 'string') return;",
      "  const fields = expandCssShorthand('font-style', value);",
      `  if (fields) this.${method}(Number(fields[0]), 1, Number(fields[1]));`,
      '}',
      '',
    ];
  }
  if (name === 'fontWeight') {
    if (lang === 'swift') return [
      `public var ${name}: ${type} {`,
      '  get { weightName }',
      '  set {',
      '    guard let fields = NSCMason.expandCssShorthand("font-weight", value: newValue) else { return }',
      '    setParsedFontWeight(fields)',
      '  }',
      '}',
      '',
    ];
    if (lang === 'kotlin') return [
      `var ${name}: ${type}`,
      `  get() = ${type}.from(values.getInt(${value}))`,
      '  set(value) = applyFontWeight(value)',
      '',
    ];
    return [
      'get fontWeight() {',
      `  return this.style_view ? getInt32(this.style_view, ${value}) : 400;`,
      '}',
      "set fontWeight(value: '100' | '200' | '300' | 'normal' | '400' | '500' | '600' | 'bold' | '700' | '800' | '900' | number) {",
      '  if (!this.style_view) return;',
      "  const weight = typeof value === 'number' ? value : Number(expandCssShorthand('font-weight', value)?.[0]);",
      `  if (weight >= 1 && weight <= 1000) this.${method}(weight, 1);`,
      '}',
      '',
    ];
  }
  return lang === 'kotlin' ? [
    `var ${name}: ${type}`,
    '  get() {',
    `    if (values.get(${state}) == StyleState.INHERIT) return "normal"`,
    `    val pct = values.getInt(${value})`,
    '    return Mason.expandCssShorthand("font-stretch-name", pct.toString())?.firstOrNull() ?: "normal"',
    '  }',
    '  set(value) {',
    '    val field = Mason.expandCssShorthand("font-stretch", value)?.firstOrNull()?.toIntOrNull() ?: return',
    `    ${method}(field, StyleState.SET)`,
    '  }',
    '',
  ] : [
    `get ${name}(): ${type} {`,
    `  if (!this.style_view || !getUint8(this.style_view, ${state})) return 'normal';`,
    `  const pct = getInt32(this.style_view, ${value});`,
    "  return expandCssShorthand('font-stretch-name', String(pct))?.[0] ?? 'normal';",
    '}',
    `set ${name}(value: ${type}) {`,
    '  if (!this.style_view) return;',
    "  const field = expandCssShorthand('font-stretch', value)?.[0];",
    `  if (field !== undefined) this.${method}(Number(field), 1);`,
    '}',
    '',
  ];
}

function spacingAccessorLines({ name, type, fields }, method) {
  const line = name === 'lineHeight';
  const [value] = fields.map(({ name }) => `StyleKeys.${name}`);
  const input = `${type} | number`;
  return [
    `get ${name}(): ${input} {`,
    `  return getFloat32(this.style_view, ${value});`,
    '}',
    `set ${name}(value: string | ${input}) {`,
    "  if (typeof value === 'string') {",
    `    const fields = nativeCssLength(value, CssParseKind.${line ? 'LineHeight' : 'LetterSpacing'}, ...numericCssContext(value, this.${line ? 'emBasis()' : 'emBasisFor(value)'}));`,
    ...(line ? [
      '    if (!fields) return;',
      '    const [kind, amount] = fields;',
      '    if (kind === 3) this.writeLineHeightState(0);',
      `    else this.${method}(amount, 1, kind);`,
    ] : [`    if (fields) this.${method}(fields[1], 1);`]),
    "  } else if (typeof value === 'number') {",
    ...(line ? ['    // The NativeScript numeric API distinguishes unitless multipliers from rem-derived pixels.'] : []),
    `    this.${method}(value, 1${line ? ', value >= 4 ? 1 : 0' : ''});`,
    "  } else if (typeof value === 'object') {",
    ...(line ? [
      `    if (value.unit === 'dip') this.${method}(value.value, 1, 1);`,
      `    else if (value.unit === 'px') this.${method}(layout.toDeviceIndependentPixels(value.value), 1, 1);`,
    ] : [`    if (value.unit === 'dip' || value.unit === 'px') this.${method}(layout.toDevicePixels(value.value), 1);`]),
    '  }',
    '}',
    '',
  ];
}

function lineLimitAccessorLines({ name, fields }, method) {
  const [value, state] = fields.map(({ name }) => `StyleKeys.${name}`);
  return [
    `get ${name}(): number | 'none' {`,
    `  if (!this.style_view || !getUint8(this.style_view, ${state})) return 'none';`,
    `  const lines = getInt32(this.style_view, ${value});`,
    "  return lines > 0 ? lines : 'none';",
    '}',
    `set ${name}(value: number | string) {`,
    '  if (!this.style_view) return;',
    `  const lines = typeof value === 'number' ? Math.trunc(value) : Number(expandCssShorthand('${cssProperty(name)}', value)?.[0]);`,
    '  if (!Number.isFinite(lines) || lines < 0 || lines > 0x7fffffff) return;',
    `  this.${method}(lines, 1);`,
    '}',
    '',
  ];
}

function positionPairAccessorLines({ name, lang, type, fields }, method) {
  const [xType, yType, xValue, yValue, state] = fields.map(({ name }) => `StyleKeys.${name}`);
  if (lang === 'swift') return [
    '/// Transform origin in device pixels or a fraction of the box size.',
    `public var ${name}: (x: ${type}, y: ${type}) {`,
    '  get {',
    '    guard hasTransformOrigin else { return (.Percent(0.5), .Percent(0.5)) }',
    `    func side(_ type: Int, _ value: Int) -> ${type} {`,
    '      let amount = getFloat(value)',
    '      return getUInt8(type) == 1 ? .Percent(amount / 100) : .Points(amount)',
    '    }',
    `    return (side(${xType}, ${xValue}), side(${yType}, ${yValue}))`,
    '  }',
    '  set {',
    `    func side(_ value: ${type}) -> (UInt8, Float) {`,
    '      switch value {',
    '      case .Points(let value): return (0, value)',
    '      case .Percent(let value): return (1, value * 100)',
    '      case .Zero: return (0, 0)',
    '      }',
    '    }',
    '    let (xType, x) = side(newValue.x)',
    '    let (yType, y) = side(newValue.y)',
    `    ${method}(xType, yType, x, y, StyleState.SET)`,
    '  }',
    '}',
    '',
    `internal var hasTransformOrigin: Bool { getUInt8(${state}) != 0 }`,
    '',
  ];
  if (lang === 'kotlin') return [
    '/** CSS transform origin as two axes. */',
    `var ${name}: ${type}`,
    '  get() {',
    `    if (values.get(${state}) == StyleState.INHERIT) return "50% 50%"`,
    '    val scale = node.mason.scale',
    '    fun side(typeKey: Int, valueKey: Int): String {',
    '      val value = values.getFloat(valueKey)',
    '      return if (values.get(typeKey).toInt() == 1) "${cssNumber(value)}%" else "${cssNumber(value / scale)}px"',
    '    }',
    `    return "\${side(${xType}, ${xValue})} \${side(${yType}, ${yValue})}"`,
    '  }',
    '  set(value) {',
    '    val mason = node.mason',
    '    val fields = Mason.nativeParseCss(value, CssParseKind.TRANSFORM_ORIGIN, mason.scale, fontSize.toFloat(),',
    '      mason.rootFontSize, mason.viewportWidth, mason.viewportHeight, 0) ?: return',
    '    if (fields.size != CssPositionResultRecord.STRIDE) return',
    '    setResolvedTransformOrigin(fields[CssPositionResultRecord.X_VALUE].toFloat(),',
    '      fields[CssPositionResultRecord.X_TYPE] == 1.0, fields[CssPositionResultRecord.Y_VALUE].toFloat(),',
    '      fields[CssPositionResultRecord.Y_TYPE] == 1.0)',
    '  }',
    '',
    'internal fun setResolvedTransformOrigin(x: Float, xIsPercent: Boolean, y: Float, yIsPercent: Boolean) {',
    `  ${method}(if (xIsPercent) 1 else 0, if (yIsPercent) 1 else 0, x, y, StyleState.SET)`,
    '}',
    '',
  ];
  const origin = name === 'transformOrigin';
  const present = `this.style_view && getUint8(this.style_view, ${state})`;
  return [
    `get ${name}(): ${type} {`,
    `  if (!(${present})) return '50% 50%';`,
    '  const side = (typeKey: StyleKeys, valueKey: StyleKeys) => {',
    '    const value = getFloat32(this.style_view, valueKey);',
    `    return getUint8(this.style_view, typeKey) === 1 ? \`\${value}%\` : \`\${${origin ? 'layout.toDeviceIndependentPixels(value)' : 'value'}}px\`;`,
    '  };',
    `  return \`\${side(${xType}, ${xValue})} \${side(${yType}, ${yValue})}\`;`,
    '}',
    `set ${name}(value: ${type}) {`,
    '  if (!this.style_view) return;',
    ...(origin ? [
      "  const parsed = parseTransformOrigin(String(value ?? ''), this.emBasisFor(value));",
      '  if (!parsed) return;',
      `  this.${method}(parsed.xType, parsed.yType, parsed.x, parsed.y, 1);`,
      '  if (__WINDOWS__) (this.view as any)?._applyWindowsTransform?.();',
    ] : [
      '  const fields = resolveCssPosition(value, CssParseKind.ObjectPosition, ...numericCssContext(value, this.emBasisFor(value)));',
      '  if (!fields) return;',
      '  const [xType, x, yType, y] = fields;',
      `  this.${method}(xType, yType, xType === 0 ? layout.toDeviceIndependentPixels(x) : x, yType === 0 ? layout.toDeviceIndependentPixels(y) : y, 1);`,
    ]),
    '}',
    '',
    ...(origin ? [
      '/** Transform origin as fractions of the box, or null when unset. */',
      'transformOriginFraction(width: number, height: number): { x: number; y: number } | null {',
      `  if (!(${present})) return null;`,
      '  const side = (typeKey: StyleKeys, valueKey: StyleKeys, size: number) => {',
      '    const value = getFloat32(this.style_view, valueKey);',
      '    if (getUint8(this.style_view, typeKey) === 1) return value / 100;',
      '    return size > 0 ? layout.toDeviceIndependentPixels(value) / size : 0;',
      '  };',
      `  return { x: side(${xType}, ${xValue}, width), y: side(${yType}, ${yValue}, height) };`,
      '}',
      '',
    ] : []),
  ];
}

function decorationAccessorLines({ name, lang, writer, fields }, method) {
  const property = cssProperty(name);
  const suffix = name.slice('textDecoration'.length);
  const capitalized = `TextDecoration${suffix}`;
  const [field, state] = fields.map(({ name }) => `StyleKeys.${name}`);
  const color = suffix === 'Color';
  const shorthand = suffix === '';
  if (writer === 'decorationThickness') return [
    `get ${name}(): number {`,
    `  return layout.toDeviceIndependentPixels(getFloat32(this.style_view, ${field}));`,
    '}',
    `set ${name}(value: string | number) {`,
    "  if (typeof value === 'number') {",
    `    this.${method}(layout.toDevicePixels(finite(value)), 1);`,
    '    return;',
    '  }',
    `  const length = decorationField('${property}', value);`,
    '  if (length == null) return;',
    "  const devicePx = length === '' ? 0 : tokenToDevicePx(length, this.emBasisFor(length));",
    `  this.${method}(devicePx, 1);`,
    '}',
    '',
  ];
  if (lang === 'ts') {
    const initial = DECORATION_BINDINGS[name].initial;
    const get = [
      `get ${name}(): string {`,
      "  if (!this.nativeView) return '';",
      `  if (__ANDROID__) return nodeHelper().get${capitalized}(this.nativeView);`,
      `  if (__APPLE__) return this.appleStyle.${name};`,
      '  if (__WINDOWS__ && this.style_view) {',
      ...(color ? [
        `    const color = getUint32(this.style_view, ${field});`,
        `    return !getUint8(this.style_view, ${state}) || color === DECORATION_COLOR_UNSET ? 'currentcolor' : new Color(color).hex;`,
      ] : [`    return textDecoration${suffix}ToCss(getUint8(this.style_view, ${field}));`]),
      '  }',
      "  return '';",
      '}',
    ];
    return [
      ...(shorthand ? [] : get),
      `set ${name}(value: string) {`,
      `  value = ${initial ? `cssInitialIfReset(value == null ? '' : String(value), '${initial}')` : "value == null ? '' : String(value)"};`,
      '  this.setPseudoCssStringValue(',
      `    '${property}', value,`,
      `    () => nodeHelper().set${capitalized}(this.nativeView, value),`,
      shorthand ? '    () => this.appleStyle.setTextDecoration(value),' : `    () => (this.appleStyle.${name} = value),`,
      '  );',
      '}',
      '',
    ];
  }
  const swift = lang === 'swift';
  if (shorthand) {
    const states = fields.slice(4).map(() => 'StyleState.SET').join(', ');
    return swift ? [
      '/// Applies the shorthand as one style write.',
      'public func setTextDecoration(_ css: String) {',
      '  guard let fields = NSCMason.expandCssShorthand("text-decoration", value: css),',
      '        fields.count == TextDecorationRecord.stride,',
      '        let thickness = resolveDecorationThickness(fields[TextDecorationRecord.thickness]) else { return }',
      '  setParsedTextDecoration(fields, thickness: thickness)',
      '}',
      '',
      'internal func setParsedTextDecoration(_ fields: [String], thickness: Float) {',
      '  guard fields.count == TextDecorationRecord.stride,',
      '        let line = UInt8(fields[TextDecorationRecord.line]),',
      '        let style = UInt8(fields[TextDecorationRecord.style]),',
      '        let color = UInt32(fields[TextDecorationRecord.color]) else { return }',
      `  ${method}(line, style, color, thickness, ${states})`,
      '}',
      '',
    ] : [
      '/** Applies the shorthand as one style write. */',
      'fun setTextDecoration(css: String) {',
      '  val fields = Mason.expandCssShorthand("text-decoration", css) ?: return',
      '  val thickness = fields.getOrNull(TextDecorationRecord.THICKNESS)?.let { resolveDecorationThickness(it) } ?: return',
      '  setParsedTextDecoration(fields, thickness)',
      '}',
      '',
      'internal fun setParsedTextDecoration(fields: Array<String>, thickness: Float) {',
      '  if (fields.size != TextDecorationRecord.STRIDE) return',
      '  val line = fields[TextDecorationRecord.LINE].toByteOrNull() ?: return',
      '  val style = fields[TextDecorationRecord.STYLE].toByteOrNull() ?: return',
      '  val color = fields[TextDecorationRecord.COLOR].toUIntOrNull()?.toInt() ?: return',
      `  ${method}(line, style, color, thickness, ${states})`,
      '}',
      '',
    ];
  }
  const styleType = `Decoration${suffix}`;
  return swift ? [
    `public var ${name}: String {`,
    ...(color ? [
      '  get {',
      '    let color = decorationColor',
      '    return color == Constants.UNSET_COLOR ? "currentcolor" : color.rgbaToHexCSS()',
      '  }',
      '  set { setDecorationColor(css: newValue) }',
    ] : [
      `  get { ${writer}.cssValue }`,
      `  set { if let value = ${styleType}.parse(newValue) { ${writer} = value } }`,
    ]),
    '}',
    '',
  ] : [
    `var ${name}: String`,
    ...(color ? [
      '  get() {',
      '    val color = decorationColor',
      '    return if (color == Constants.UNSET_COLOR.toInt()) "currentcolor" else color.argbToCssHex()',
      '  }',
      '  set(value) {',
      '    Mason.expandCssShorthand("text-decoration-color", value)',
      '      ?.firstOrNull()?.toUIntOrNull()?.let { decorationColor = it.toInt() }',
      '  }',
    ] : [
      `  get() = ${writer}.cssValue`,
      `  set(value) { Styles.${styleType}.parse(value)?.let { ${writer} = it } }`,
    ]),
    '',
  ];
}

function windowsDecorationWriterLines(schema) {
  const entries = schema.accessors.filter(({ shape, lang }) => shape === 'decoration' && lang === 'ts');
  return [
    'private writeWindowsTextDecoration(name: string, value: string) {',
    '  switch (name) {',
    ...entries.flatMap(({ name, writer }) => {
      const property = cssProperty(name);
      const capitalized = name[0].toUpperCase() + name.slice(1);
      const method = `this.write${writer[0].toUpperCase()}${writer.slice(1)}`;
      const length = '(token) => cssLengthToDip(token, this.emBasisFor(token))';
      const lines = writer === 'textDecoration' ? [
        `const decoration = parseTextDecoration(value, ${length});`,
        `if (decoration) ${method}(decoration.line, decoration.style, decoration.color, decoration.thickness, 1, 1, 1, 1);`,
      ] : writer === 'decorationThickness' ? [
        'const length = decorationField(name, value);',
        'if (length == null) break;',
        "const thickness = length === '' ? 0 : cssLengthToDip(length, this.emBasisFor(length));",
        `if (thickness != null) ${method}(thickness, 1);`,
      ] : [
        `const result = parse${capitalized}(value);`,
        `if (result != null) ${method}(result, 1);`,
      ];
      return [`    case '${property}': {`, ...lines.map((line) => `      ${line}`), '      break;', '    }'];
    }),
    '  }',
    '}',
  ];
}

function boxSidesAccessorLines({ name, type, write }, method) {
  const { group, mask } = write.physical;
  const state = stateName(write.states[0], 'ts');
  const members = name === 'inset' ? ['top', 'right', 'bottom', 'left'] : ['Top', 'Right', 'Bottom', 'Left'].map((side) => name + side);
  const kind = type === 'LengthAuto' ? 'auto' : 'length';
  return [
    `set ${name}(value: ${type}) {`,
    "  if (typeof value === 'string' && value.trim()) {",
    `    const sides = expandCssShorthand('${name}', value);`,
    '    if (!sides) return;',
    '    const wasInBatch = this.inBatch;',
    '    this.inBatch = true;',
    '    try {',
    ...members.map((member, index) => `      this.${member} = sides[${index}] as never;`),
    '    } finally {',
    '      this.inBatch = wasInBatch;',
    '    }',
    `    this.stampPhysical('${group}', ${mask});`,
    `    this.commitState(StateKeys.${state});`,
    '    return;',
    '  }',
    '',
    `  const length = layoutLengthValue(value, '${kind}', this.emBasisFor(value));`,
    `  if (length) this.${method}(`,
    '    length.type, length.value, length.type, length.value,',
    '    length.type, length.value, length.type, length.value,',
    '  );',
    '}',
    '',
  ];
}

function colorAccessorLines({ name, type, writer, write }, method) {
  const [value, state] = write.fields;
  const background = writer === 'backgroundColor';
  const flush = background ? ['  this.flushBackgroundWrites();'] : [];
  return [
    `get ${name}(): ${type} {`,
    ...flush,
    `  return this.style_view ? getUint32(this.style_view, StyleKeys.${value.name}) : 0;`,
    '}',
    `set ${name}(value: number | string | { argb?: number }) {`,
    ...flush,
    '  if (!this.style_view) return;',
    '  const normalized = normalizeColorValue(value);',
    '  if (normalized == null) {',
    background ? '    // Reset to transparent.' : '    // Reset the state so the color inherits again.',
    `    if (getInt8(this.style_view, StyleKeys.${state.name})) {`,
    background ? '      this.writeBackgroundColor(0, 0, 0);' : '      this.writeFontColorState(0);',
    '    }',
    '    return;',
    '  }',
    `  this.${method}(normalized, 1${background ? ', 0' : ''});`,
    '}',
    '',
  ];
}

function borderStylesAccessorLines({ type, keywords }, method) {
  return [
    'private readBorderStyle(offset: number): string {',
    '  switch (getInt8(this.style_view, offset)) {',
    ...[...keywords].filter(([keyword]) => keyword !== 'none').map(([keyword, { code }]) => `    case ${code}: return '${keyword}';`),
    "    default: return 'none';",
    '  }',
    '}',
    '',
    `get borderStyle(): ${type} {`,
    '  const top = this.borderTopStyle;',
    '  const right = this.borderRightStyle;',
    '  const bottom = this.borderBottomStyle;',
    '  const left = this.borderLeftStyle;',
    '  if (top === bottom && right === left) return top === right ? top : `${top} ${right}`;',
    '  return `${top} ${right} ${bottom} ${left}`;',
    '}',
    `set borderStyle(value: ${type}) {`,
    "  const fields = expandCssShorthand('border-style-values', value);",
    '  if (!fields) return;',
    '  const [top, right, bottom, left] = fields.map(Number);',
    `  this.${method}(top, right, bottom, left);`,
    '}',
    '',
  ];
}

function borderStyleKeywords({ keywords }) {
  return [...keywords.find(({ properties }) => properties.includes('border-style')).values];
}

function rustBorderStyleLines(schema) {
  const entries = borderStyleKeywords(schema);
  return [
    '#[derive(Copy, Clone, PartialEq, Eq, Debug, Default)]',
    'pub enum BorderStyle {',
    ...entries.flatMap(([name, { code }]) => [
      ...(name === 'none' ? ['    #[default]'] : []),
      `    ${capitalize(name)} = ${code},`,
    ]),
    '}',
    '',
    'impl std::fmt::Display for BorderStyle {',
    "    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {",
    '        f.write_str(match self {',
    ...entries.map(([name]) => `            Self::${capitalize(name)} => "${name}",`),
    '        })',
    '    }',
    '}',
  ];
}

function rustBorderStyleConversionLines(schema) {
  return [
    'pub const fn border_style_from_enum(value: i8) -> Option<BorderStyle> {',
    '    match value {',
    ...borderStyleKeywords(schema).map(([name, { code }]) => `        ${code} => Some(BorderStyle::${capitalize(name)}),`),
    '        _ => None,',
    '    }',
    '}',
    '',
    'pub const fn border_style_to_enum(value: BorderStyle) -> i8 {',
    '    value as i8',
    '}',
  ];
}

function swiftBorderStyleCodeLines(schema) {
  const entries = borderStyleKeywords(schema);
  const hasArguments = new Set(['dotted', 'dashed', 'double']);
  return [
    'public init?(rawValue: Int8) {',
    '  switch rawValue {',
    ...entries.map(([name, { code }]) => `  case ${code}: self = BorderStyle.${name}${hasArguments.has(name) ? '()' : ''}`),
    '  default: return nil',
    '  }',
    '}',
    '',
    'public var rawValue: Int8 {',
    '  switch self {',
    ...entries.map(([name, { code }]) => `  case .${name}: return ${code}`),
    '  }',
    '}',
  ];
}

function maskKeywordBindings(schema) {
  return [
    ['mask-clip', 'MaskClip', 'MaskBox'],
    ['mask-mode', 'MaskMode', 'MaskMode'],
    ['mask-composite', 'MaskComposite', 'MaskComposite'],
  ].map(([property, type, swiftType]) => {
    const values = schema.keywords.find(({ properties }) => properties.includes(property)).values;
    const names = new Map();
    for (const [name, { code }] of values) {
      if (!names.has(code)) names.set(code, name);
    }
    const entries = [...names].sort(([a], [b]) => a - b);
    if (!entries.every(([code], index) => code === index)) throw new Error(`${property} codes must be contiguous from zero`);
    return { property, type, swiftType, entries };
  });
}

function rustMaskKeywords(schema) {
  return maskKeywordBindings(schema).flatMap(({ property, type, entries }) => {
    const member = (name) => pascal((type === 'MaskClip' ? name.replace(/-box$/, '') : name).replaceAll('-', '_'));
    return [
      '#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]',
      '#[repr(u8)]',
      `pub enum ${type} {`,
      ...entries.flatMap(([code, name]) => [
        ...(code === 0 ? ['    #[default]'] : []),
        `    ${member(name)} = ${code},`,
      ]),
      '}',
      '',
      `impl ${type} {`,
      '    fn parse(value: &str) -> Option<Self> {',
      `        match super::keywords::code("${property}", value, false)? {`,
      ...entries.map(([code, name]) => `            ${code} => Some(Self::${member(name)}),`),
      '            _ => None,',
      '        }',
      '    }',
      ...(type === 'MaskComposite' ? [
        '',
        "    fn keyword(self) -> &'static str {",
        '        match self {',
        ...entries.map(([, name]) => `            Self::${member(name)} => "${name}",`),
        '        }',
        '    }',
      ] : []),
      '}',
      '',
    ];
  }).slice(0, -1);
}

function kotlinMaskKeywords(schema) {
  return maskKeywordBindings(schema).flatMap(({ property, type, entries }) => [
    `enum class ${type}(val css: String) {`,
    ...entries.map(([, name], index) => `  ${name.replaceAll('-', '_').toUpperCase()}("${name}")${index === entries.length - 1 ? ';' : ','}`),
    '',
    '  companion object {',
    `    internal fun fromCode(code: Int): ${type}? = entries.getOrNull(code)`,
    '',
    `    fun parse(value: String): ${type}? =`,
    `      Mason.expandCssShorthand("keyword:${property}", value)?.firstOrNull()?.toIntOrNull()?.let(::fromCode)`,
    '  }',
    '}',
    '',
  ]).slice(0, -1);
}

function swiftMaskKeywords(schema) {
  return maskKeywordBindings(schema).flatMap(({ property, swiftType, entries }) => {
    const isBox = swiftType === 'MaskBox';
    const member = (name) => camel(name.replaceAll('-', '_'));
    return [
      `enum ${swiftType}: ${isBox ? 'Equatable' : 'String'} {`,
      ...entries.map(([, name]) => `  case ${member(name)}${!isBox && member(name) !== name ? ` = "${name}"` : ''}`),
      '',
      `  static func fromCode(_ code: UInt8) -> ${swiftType}? {`,
      '    switch code {',
      ...entries.map(([code, name]) => `    case ${code}: return .${member(name)}`),
      '    default: return nil',
      '    }',
      '  }',
      '',
      `  static func parse(_ value: String${isBox ? ', allowNoClip: Bool' : ''}) -> ${swiftType}? {`,
      `    guard let field = NSCMason.expandCssShorthand("keyword:${property}", value: value)?.first,`,
      '          let code = UInt8(field) else { return nil }',
      ...(isBox ? ['    let box = fromCode(code)', '    return box == .noClip && !allowNoClip ? nil : box'] : ['    return fromCode(code)']),
      '  }',
      '}',
      '',
    ];
  }).slice(0, -1);
}

function cornerMember(field) {
  return camel(field.name.slice('BORDER_RADIUS_'.length, -'_EXPONENT'.length));
}

function cornerAccessorLines({ lang, name, type, fields }, method) {
  const capitalized = name[0].toUpperCase() + name.slice(1);
  const property = cssProperty(name);
  if (lang === 'ts') return [
    `get ${name}(): ${type} {`,
    "  if (!this.nativeView) return '';",
    `  if (__ANDROID__) return nodeHelper().get${capitalized}(this.nativeView);`,
    `  if (__APPLE__) return this.appleStyle.${name};`,
    `  return __WINDOWS__ ? (this._windowsCss.get('${property}') ?? '') : '';`,
    '}',
    `set ${name}(value: ${type}) {`,
    "  value = value == null ? '' : String(value);",
    '  this.setPseudoCssStringValue(',
    `    '${property}', value,`,
    `    () => nodeHelper().set${capitalized}(this.nativeView, value),`,
    `    () => (this.appleStyle.${name} = value),`,
    '  );',
    '}',
    '',
  ];
  const swift = lang === 'swift';
  if (fields.length === 1) {
    const [field] = fields;
    return swift ? [
      `public var ${name}: ${type} {`,
      `  get { CSSBorderRenderer.exponentToCornerShapeToken(Float(mBorderRender.cssRadius.${cornerMember(field)}.exponent)) }`,
      '  set {',
      '    guard let exponent = CSSBorderRenderer.parseCornerShapeToken(newValue) else { return }',
      `    ${method}(exponent)`,
      '  }',
      '}',
      '',
    ] : [
      `var ${name}: ${type}`,
      '  get() {',
      `    val base = values.getFloat(StyleKeys.${field.name})`,
      `    val exponent = resolvePseudo(StateKeys.BORDER_RADIUS, base) { it.getFloat(StyleKeys.${field.name}) }`,
      '    return exponentToCornerShapeToken(exponent)',
      '  }',
      '  set(value) {',
      `    parseCornerShapeToken(value)?.let { ${method}(it) }`,
      '  }',
      '',
    ];
  }
  const members = fields.map(cornerMember);
  return swift ? [
    'private var authoredCornerShape = ""',
    `public var ${name}: ${type} {`,
    '  get { authoredCornerShape }',
    '  set {',
    '    authoredCornerShape = newValue',
    `    guard let fields = NSCMason.expandCssShorthand("${property}", value: newValue), fields.count == ${fields.length},`,
    ...members.map((member, index) =>
      `          let ${member} = Float(fields[${index}])${index < fields.length - 1 ? ',' : ' else { return }'}`),
    `    ${method}(${members.join(', ')})`,
    '  }',
    '}',
    '',
  ] : [
    `var ${name}: ${type} = ""`,
    '  set(value) {',
    '    field = value',
    '    applyCornerShape(value)',
    '  }',
    '',
    `internal fun applyCornerShape(value: ${type}) {`,
    `  val fields = Mason.expandCssShorthand("${property}", value) ?: return`,
    `  if (fields.size != ${fields.length}) return`,
    `  val (${members.join(', ')}) = fields.map { it.toFloatOrNull() ?: return }`,
    `  ${method}(${members.join(', ')})`,
    '}',
    '',
  ];
}

function windowsCornerWriterLines(schema) {
  const entries = schema.accessors.filter(({ shape, lang }) => shape === 'corner' && lang === 'ts');
  return [
    'private writeWindowsCornerShape(name: string, value: string) {',
    '  const fields = expandCssShorthand(name, value);',
    '  if (!fields) return;',
    '  switch (name) {',
    ...entries.map(({ name, fields }) => {
      const method = `write${name[0].toUpperCase()}${name.slice(1)}`;
      const values = fields.map((_, index) => `Number(fields[${index}])`);
      return `    case '${cssProperty(name)}': this.${method}(${values.join(', ')}); break;`;
    }),
    '  }',
    '}',
  ];
}

function accessorLines(schema, lang) {
  const swift = lang === 'swift';
  const layoutMathProperties = new Map(schema.layoutMath.map(({ target, name }) => [target, name]));
  return schema.accessors.filter((entry) => entry.lang === lang).flatMap((entry) => {
    const { name, writer, shape, type, flags, fields, write } = entry;
    const method = `write${writer[0].toUpperCase()}${writer.slice(1)}`;
    if (shape === 'textlength') return textLengthAccessorLines(entry, method);
    if (shape === 'vertical') return verticalAccessorLines(entry, method);
    if (shape === 'bitset') return bitsetAccessorLines(entry, method);
    if (shape === 'font') return fontAccessorLines(entry, method);
    if (shape === 'spacing') return spacingAccessorLines(entry, method);
    if (shape === 'limit') return lineLimitAccessorLines(entry, method);
    if (shape === 'positionpair') return positionPairAccessorLines(entry, method);
    if (shape === 'decoration') return decorationAccessorLines(entry, method);
    if (shape === 'color') return colorAccessorLines(entry, method);
    if (shape === 'corner') return cornerAccessorLines(entry, method);
    if (shape === 'boxsides') return boxSidesAccessorLines(entry, method);
    if (shape === 'borderstyles') return borderStylesAccessorLines(entry, method);
    if (shape === 'borderside') return [
      `get ${name}(): ${type} {`,
      `  return this.readBorderStyle(StyleKeys.${fields[0].name});`,
      '}',
      `set ${name}(value: ${type}) {`,
      "  const code = cssKeywordCode('border-style', value);",
      `  if (code != null) this.${method}(code);`,
      '}',
      '',
    ];
    if (shape === 'cssbordercolor') return [
      `public func setBorderColor(_ css: ${type}) {`,
      '  guard let fields = NSCMason.expandCssShorthand("border-color-values", value: css) else { return }',
      '  let sides = fields.compactMap { UInt32($0) }',
      '  guard sides.count == 4 else { return }',
      `  ${method}(sides[0], sides[1], sides[2], sides[3])`,
      '}',
      '',
    ];
    if (shape === 'display') {
      const visibility = schema.keywords.find(({ properties }) => properties.includes('visibility'));
      return displayAccessorLines(entry, visibility.values.get('collapse').code);
    }
    if (lang === 'ts') {
      if (shape === 'nan') return [
        `get ${name}(): number {`,
        `  return getFloat32(this.style_view, StyleKeys.${fields[0].name});`,
        '}',
        `set ${name}(value: number | string) {`,
        "  const ratio = typeof value === 'number' ? value : parseAspectRatio(value);",
        `  const current = getFloat32(this.style_view, StyleKeys.${fields[0].name});`,
        '  if (current === ratio || (Number.isNaN(current) && Number.isNaN(ratio))) return;',
        `  this.${method}(ratio);`,
        '}',
        '',
      ];
      if (shape === 'gap') return [
        `get ${name}(): ${type} {`,
        '  const row = this.rowGap;',
        '  const column = this.columnGap;',
        "  const rowCss = typeof row === 'string' ? row : CoreLength.convertToString(row as never);",
        "  const columnCss = typeof column === 'string' ? column : CoreLength.convertToString(column as never);",
        '  return rowCss === columnCss ? rowCss : `${rowCss} ${columnCss}`;',
        '}',
        `set ${name}(value: ${type}) {`,
        "  if (typeof value !== 'string') return;",
        "  const gaps = expandCssShorthand('gap', value);",
        '  if (!gaps) return;',
        "  const [rowValue, columnValue] = gaps.map((gap) => gap === 'normal' ? 0 : gap);",
        "  if (layoutMathText(rowValue) || layoutMathText(columnValue)) {",
        '    this.rowGap = rowValue as Length;',
        '    this.columnGap = columnValue as Length;',
        '    return;',
        '  }',
        "  const row = layoutLengthValue(rowValue, 'length', this.emBasisFor(rowValue));",
        "  const column = layoutLengthValue(columnValue, 'length', this.emBasisFor(columnValue));",
        `  if (row && column) this.${method}(row.type, row.value, column.type, column.value);`,
        '}',
        '',
      ];
      if (shape === 'devicepoints') return [
        `get ${name}(): number | ${type} {`,
        `  return getFloat32(this.style_view, StyleKeys.${fields[0].name});`,
        '}',
        `set ${name}(value: number | ${type}) {`,
        `  if (typeof value === 'number') this.${method}(value);`,
        `  else if (typeof value === 'object' && (value.unit === 'dip' || value.unit === 'px')) this.${method}(layout.toDevicePixels(value.value));`,
        '}',
        '',
      ];
      if (shape === 'scalar') {
        const reader = fields[0].type === 'i32' ? 'getInt32' : 'getFloat32';
        const read = `${reader}(this.style_view, StyleKeys.${fields[0].name})`;
        return [
          `get ${name}(): number {`,
          `  return ${read};`,
          '}',
          `set ${name}(value: number) {`,
          ...(flags.has('changed') ? [`  if (${read} === value) return;`] : []),
          `  this.${method}(value);`,
          '}',
          '',
        ];
      }
      if (shape === 'enumpoint') {
        const codes = [...entry.keywords].map(([keyword, { code }]) => `${JSON.stringify(keyword)}: ${code}`).join(', ');
        return [
          `get ${name}() {`,
          `  const x = this.${name}X;`,
          `  const y = this.${name}Y;`,
          '  return x === y ? x : `${x} ${y}`;',
          '}',
          `set ${name}(value: ${type} | \`\${${type}} \${${type}}\`) {`,
          `  const axes = expandCssShorthand('${entry.property}', value);`,
          '  if (!axes) return;',
          `  const codes: Record<string, number> = { ${codes} };`,
          `  this.${method}(codes[axes[0]], codes[axes[1]]);`,
          '}',
          '',
        ];
      }
      if (shape === 'keyword') {
        const names = new Map();
        for (const [keyword, { code, readAlias }] of entry.keywords) {
          if (!names.has(code) && !(type === 'GridAutoFlow' && keyword === 'dense')) names.set(code, keyword);
          if (readAlias !== undefined) names.set(readAlias, keyword);
        }
        const literal = (word) => `'${word}'`;
        const union = (words) => [...words].map(literal).join(' | ');
        const fallback = entry.fallback === 'undefined' ? 'undefined' : literal(entry.fallback);
        const read = `${entry.signed ? 'getInt8' : 'getUint8'}(this.style_view, StyleKeys.${fields[0].name})`;
        const initialized = flags.has('read-state') ? ` || !getUint8(this.style_view, StyleKeys.${write.fields[1].name})` : '';
        const numeric = type === 'number';
        const unset = type === 'GridAutoFlow' ? literal('row') : numeric ? 0 : fallback;
        const outputType = type === 'literal' ? union(new Set(names.values())) + (fallback === 'undefined' ? ' | undefined' : '') : type;
        const inputType = (numeric ? 'number | ' : '') + (entry.input === 'literal' ? union(entry.keywords.keys()) : entry.input);
        const parse = `cssKeywordCode('${entry.property}', value)`;
        const parseNumber = numeric
          ? `typeof value === 'number' ? (value >= ${Math.min(...names.keys())} && value < ${Math.max(...names.keys()) + 1} ? value : undefined) : `
          : '';
        const reset = entry.invalid === 'reset' ? ` ?? ${entry.keywords.get(entry.fallback).code}` : '';
        const call = `this.${method}(code${write.fields.length === 2 ? ', 1' : ''});`;
        const guard = [entry.invalid === 'reset' ? '' : 'code !== undefined', flags.has('changed') ? `${read} !== code` : ''].filter(Boolean).join(' && ');
        return [
          `get ${name}(): ${outputType} {`,
          `  if (!this.style_view${initialized}) return ${unset};`,
          ...(numeric ? [`  return ${read};`] : [
            `  switch (${read}) {`,
            ...[...names].filter(([, keyword]) => keyword !== entry.fallback).map(([code, keyword]) => `    case ${code}: return ${literal(keyword)};`),
            `    default: return ${fallback};`,
            '  }',
          ]),
          '}',
          `set ${name}(value: ${inputType}) {`,
          '  if (!this.style_view) return;',
          `  const code = ${parseNumber}${parse}${reset};`,
          guard ? `  if (${guard}) ${call}` : `  ${call}`,
          ...(entry.invalid === 'notify' ? [`  else this.commitState(StateKeys.${stateName(write.states[0], lang)});`] : []),
          '}',
          '',
        ];
      }
      const { kind, read } = TS_LENGTH_BINDINGS[type];
      const property = layoutMathProperties.get(writer);
      const typeRead = `getInt8(this.style_view, StyleKeys.${fields[0].name})`;
      const valueRead = `getFloat32(this.style_view, StyleKeys.${fields[1].name})`;
      return [
        `get ${name}() {`,
        ...(property ? [`  const type = ${typeRead};`, `  return this.readLayoutMath('${property}', type) ?? ${read}(type, ${valueRead});`]
          : [`  return ${read}(${typeRead}, ${valueRead});`]),
        '}',
        `set ${name}(value: ${type}) {`,
        ...(property ? [`  if (this.applyLayoutMath('${property}', value)) return;`] : []),
        `  const length = layoutLengthValue(value, '${kind}', this.emBasisFor(value));`,
        `  if (length) this.${method}(length.type, length.value);`,
        '}',
        '',
      ];
    }
    const state = `StateKeys.${stateName(write.states[0], lang)}`;
    const fallback = [...flags].find((flag) => flag.startsWith('fallback='))?.slice(9);
    const unwrap = swift ? (fallback ? ` ?? .${fallback}` : '!') : '!!';
    const input = swift ? 'newValue' : 'value';
    const byte = (value) => swift ? `UInt8(bitPattern: ${value})` : value;
    const read = ({ name, type }, buffer) => {
      const method = {
        swift: { u8: shape === 'scalar' && entry.type === 'UInt8' ? 'getUInt8' : 'getInt8', i8: 'getInt8', i32: 'getInt32', u32: 'getUInt32', f32: 'getFloat' },
        kotlin: { u8: 'get', i8: 'get', i32: 'getInt', u32: 'getInt', f32: 'getFloat' },
      }[lang][type];
      return `${swift ? '' : `${buffer}.`}${method}(StyleKeys.${name})`;
    };
    const length = (index, buffer) => {
      const unit = read(fields[index], buffer);
      const value = read(fields[index + 1], buffer);
      return (swift ? `${type}.fromValueType(${value}, ${unit})` : `${type}.fromTypeValue(${unit}, ${value})`) + unwrap;
    };
    const rect = shape === 'rect' || shape === 'enumrect' || shape === 'colorrect';
    const point = shape === 'point' || shape === 'enumpoint';
    const boxName = rect ? 'Rect' : point ? 'Point' : 'Size';
    const box = swift ? `Mason${boxName}` : boxName;
    const members = rect ? ['top', 'right', 'bottom', 'left'] : point ? ['x', 'y'] : ['width', 'height'];
    const boxShape = rect || shape === 'size' || point;
    const propertyType = boxShape ? `${box}<${type}>` : shape === 'nan' ? `${type}?` : type;
    const capitalized = name[0].toUpperCase() + name.slice(1);
    const enumRead = (value) => flags.has('decoded') ? `decode${capitalized}(${value})`
      : swift ? `${type}(rawValue: ${value})${unwrap}` : `${type}.from(${value})`;
    const enumWrite = (value) => swift ? byte(`${value}.rawValue`) : `${value}.value`;
    const getter = (buffer) => {
      const value = read(fields[0], buffer);
      switch (shape) {
        case 'enum': return enumRead(value);
        case 'length': return length(0, buffer);
        case 'enumpoint':
          if (flags.has('axis-pseudo')) return `${box}(${name}X, ${name}Y)`;
          // Fall through to the grouped enum reader.
        case 'enumrect':
        case 'colorrect':
          return `${box}(\n${fields.map((field) => `  ${shape === 'colorrect' ? read(field, buffer) : enumRead(read(field, buffer))}`).join(',\n')}\n)`;
        case 'size':
        case 'point':
        case 'rect': return `${box}(\n${members.map((_, i) => `  ${length(i * 2, buffer)}`).join(',\n')}\n)`;
        case 'points': return `${type}.Points(${value})`;
        case 'nan': return swift ? `let value = ${value}\nreturn value.isNaN ? nil : value` : `${value}.takeUnless { it.isNaN() }`;
        default: return value;
      }
    };
    let values;
    if (shape === 'enum') values = [enumWrite(input)];
    else if (shape === 'length') values = [byte(`${input}.type`), `${input}.value`];
    else if (shape === 'enumrect' || shape === 'enumpoint') values = members.map((member) => enumWrite(`${input}.${member}`));
    else if (shape === 'colorrect') values = members.map((member) => `${input}.${member}`);
    else if (boxShape) values = members.flatMap((member) => [byte(`${input}.${member}.type`), `${input}.${member}.value`]);
    else if (shape === 'points') values = [`${input}.value`];
    else if (shape === 'nan') values = [swift ? `${input} ?? .nan` : `${input} ?: Float.NaN`];
    else if (flags.has('nonnegative')) values = [swift ? `max(0, ${input})` : `${input}.coerceAtLeast(0)`];
    else values = [input];
    const args = [...values, ...entry.constants];
    const setter = flags.has('side-record') ? [`apply${capitalized}(${input})`]
      : args.length < 4 ? [`${method}(${args.join(', ')})`]
      : [`${method}(`, ...args.map((arg, i) => `  ${arg}${i + 1 < args.length ? ',' : ''}`), ')'];
    const post = [];
    if (flags.has('dirty')) post.push('node.dirty()');
    if (flags.has('font-metrics')) post.push('syncFontMetrics()');
    if (flags.has('marker')) post.push(
      '// A summary can build its marker before the list style is applied.',
      swift ? 'if node.detailsRole == MasonDetails.summary { MasonDetails.refreshMarker(node) }'
        : 'if (node.detailsRole == Details.SUMMARY) Details.refreshMarker(node)',
    );
    const expression = (indent, prefix, buffer) => getter(buffer).split('\n').map((line, i) => indent + (i === 0 ? prefix : '') + line);
    const docs = entry.comment ? [swift ? `/// ${entry.comment}` : `/** ${entry.comment} */`] : [];
    if (flags.has('readonly')) return swift
      ? [...docs, `internal var ${name}: ${type} { ${getter()} }`, '']
      : [...docs, `internal val ${name}: ${type}`, ...expression('  ', 'get() = ', 'values'), ''];
    if (swift) return [
      ...docs,
      `${flags.has('internal') ? 'internal' : 'public'} var ${name}: ${propertyType} {`,
      ...(boxShape || shape === 'nan'
        ? ['  get {', ...expression('    ', boxShape ? 'return ' : ''), '  }']
        : [`  get { ${getter()} }`]),
      '  set {',
      ...(flags.has('changed') ? [`    guard newValue != ${name} else { return }`] : []),
      ...[...setter, ...post].map((line) => `    ${line}`),
      '  }',
      '}',
      '',
    ];
    const getterLines = flags.has('pseudo')
      ? ['  get() {', ...expression('    ', 'val base = ', 'values'),
        `    return resolvePseudo(${state}, base) { buf ->`, ...expression('      ', '', 'buf'), '    }', '  }']
      : expression('  ', `get() = ${flags.has('inherit-zero') ? `if (${read(write.fields[1], 'values')} == StyleState.INHERIT) 0 else ` : ''}`, 'values');
    const unchanged = flags.has('changed') ? [
      shape === 'length'
        ? `    if (${read(fields[0], 'values')} == value.type && ${read(fields[1], 'values')} == value.value) return`
        : `    if (value == ${name}) return`,
    ] : [];
    return [...docs, `${flags.has('internal') ? 'internal ' : ''}var ${name}: ${propertyType}`, ...getterLines, '  set(value) {', ...unchanged,
      ...[...setter, ...post].map((line) => `    ${line}`), '  }', ''];
  }).slice(0, -1);
}

function writerLines(schema, lang) {
  return schema.writes.filter((entry) => entry.langs.includes(lang)).flatMap((entry) => {
    const fields = entry.fields.map(({ name, type }) => {
      const [argType, setter] = WRITER_TYPES[type][lang];
      return { name: camel(name), key: `StyleKeys.${name}`, argType, setter };
    });
    const states = entry.states.map((state) => `StateKeys.${stateName(state, lang)}`);
    const args = fields.map(({ name, argType }) => lang === 'swift' ? `_ ${name}: ${argType}` : `${name}: ${argType}`).join(', ');
    const call = {
      ts: `this.commitState(${states[0]}${states.slice(1).map((state) => `.or(${state})`).join('')});`,
      kotlin: `setOrAppendState(${states.length === 1 ? states[0] : `arrayOf(${states.join(', ')})`})`,
      swift: `setOrAppendState(${states[0]}${states.slice(1).map((state) => `.union(${state})`).join('')})`,
    }[lang];
    const commit = entry.mode === 'transform' && lang === 'swift' ? [
      'if inBatch {',
      `  ${call}`,
      '} else if transformDependsOnOrigin {',
      '  applyTransformFromBuffer()',
      '}',
    ] : entry.mode === 'text' && lang !== 'ts' ? [
      lang === 'swift'
        ? `let state = ${states[0]}${states.slice(1).map((state) => `.union(${state})`).join('')}`
        : `val state = ${states.join(' or ')}`,
      'if (inBatch) {',
      '  setOrAppendState(state)',
      '} else {',
      '  notifyTextStyleChanged(state)',
      '}',
    ] : entry.mode === 'corner' && lang === 'swift' ? [
      ...entry.fields.map((field, index) => `mBorderRender.cssRadius.${cornerMember(field)}.exponent = CGFloat(${fields[index].name})`),
      'mBorderRender.invalidateCache()',
      call,
    ] : entry.mode === 'corner' && lang === 'kotlin' ? [
      'invalidateBorderRenderer()',
      call,
    ] : [call];
    const setters = fields.map(({ name, key, setter }) => ({
      ts: `${setter}(this.style_view, ${key}, ${name});`,
      kotlin: `values.${setter}(${key}, ${name})`,
      swift: `${setter}(${key}, ${name})`,
    })[lang]);
    const stamp = lang === 'ts' && entry.physical
      ? [`  this.stampPhysical('${entry.physical.group}', ${entry.physical.mask});`]
      : [];
    return [
      `private ${lang === 'ts' ? '' : `fun${lang === 'swift' ? 'c' : ''} `}write${entry.name[0].toUpperCase() + entry.name.slice(1)}(${args}) {`,
      lang === 'ts' ? '  this.prepareMut();' : '  prepareMut()',
      ...setters.map((line) => `  ${line}`),
      ...stamp,
      ...commit.map((line) => `  ${line}`),
      '}',
      '',
    ];
  }).slice(0, -1);
}

const BORDER_SIDE_MEMBERS = ['widthType', 'widthValue', 'style', 'color'];
const CORNER_MEMBERS = ['xType', 'xValue', 'yType', 'yValue'];

function borderState(schema, name, lang) {
  return `StateKeys.${stateName(schema.borderStates[name], lang)}`;
}

function kotlinBorderKeysLines({ borderSides, borderCorners }) {
  const sideMembers = [...BORDER_SIDE_MEMBERS, ...[1, 2].flatMap((index) => [
    ...CORNER_MEMBERS.map((member) => `corner${index}Radius${capitalize(member)}`),
    `corner${index}Exponent`,
  ])];
  const valLines = (names, fields, indent) => names.map((name, index) =>
    `${indent}override val ${name}: Int get() = StyleKeys.${fields[index].name}`);
  return [
    'interface IKey {',
    ...sideMembers.map((member) => `  val ${member}: Int`),
    '}',
    '',
    'class Keys {',
    ...borderSides.flatMap(({ side, fields, corners }) => [
      `  class ${capitalize(side)} : IKey {`,
      ...valLines(sideMembers, [...fields, ...corners.flatMap((corner) => {
        const { radius, exponent } = borderCorners.get(corner);
        return [...radius, exponent];
      })], '    '),
      '  }',
      '',
    ]),
    '  companion object {',
    ...borderSides.map(({ side }) => `    val ${side} by lazy { ${capitalize(side)}() }`),
    '  }',
    '}',
    '',
    'interface IKeyCorner {',
    ...[...CORNER_MEMBERS, 'exponent'].map((member) => `  val ${member}: Int`),
    '}',
    '',
    ...[...borderCorners].flatMap(([corner, { radius, exponent }]) => [
      `object corner${capitalize(corner)}Keys : IKeyCorner {`,
      ...valLines([...CORNER_MEMBERS, 'exponent'], [...radius, exponent], '  '),
      '}',
      '',
    ]),
  ].slice(0, -1);
}

function kotlinBorderAccessorLines(schema) {
  const widthState = borderState(schema, 'width', 'kotlin');
  const colorState = borderState(schema, 'color', 'kotlin');
  const styleState = borderState(schema, 'style', 'kotlin');
  const radiusState = borderState(schema, 'radius', 'kotlin');
  const readLength = (buffer, type, value) => `LengthPercentage.fromTypeValue(${buffer}.get(keys.${type}), ${buffer}.getFloat(keys.${value}))!!`;
  const bind = (name, type, state, read, writes, unchanged) => [
    `var ${name}: ${type}`,
    '  get() {',
    `    val base = ${read('owner.values')}`,
    `    return owner.resolvePseudo(${state}, base) { buf -> ${read('buf')} }`,
    '  }',
    '  set(value) {',
    ...(unchanged ? [`    if (${unchanged}) return`] : []),
    '    owner.prepareMut()',
    ...writes.map(([setter, key, value]) => `    owner.values.${setter}(keys.${key}, ${value})`),
    `    if (setState) owner.setOrAppendState(${state})`,
    '  }',
    '',
  ];
  return [
    ...bind('width', 'LengthPercentage', widthState,
      (buffer) => readLength(buffer, 'widthType', 'widthValue'),
      [['put', 'widthType', 'value.type'], ['putFloat', 'widthValue', 'value.value']],
      'owner.values.get(keys.widthType) == value.type && owner.values.getFloat(keys.widthValue) == value.value'),
    ...bind('color', 'Int', colorState, (buffer) => `${buffer}.getInt(keys.color)`, [['putInt', 'color', 'value']], 'color == value'),
    ...bind('style', 'BorderStyle', styleState, (buffer) => `BorderStyle.from(${buffer}.get(keys.style))`, [['put', 'style', 'value.value']], 'style == value'),
    ...[1, 2].flatMap((index) => {
      const radius = `corner${index}Radius`;
      const exponent = `corner${index}Exponent`;
      return [
        `private fun readCorner${index}(buf: ByteBuffer): Point<LengthPercentage> = Point(`,
        `  ${readLength('buf', radius + 'XType', radius + 'XValue')},`,
        `  ${readLength('buf', radius + 'YType', radius + 'YValue')}`,
        ')',
        '',
        ...bind(radius, 'Point<LengthPercentage>', radiusState, (buffer) => `readCorner${index}(${buffer})`, ['x', 'y'].flatMap((axis) => [
          ['put', radius + capitalize(axis) + 'Type', `value.${axis}.type`],
          ['putFloat', radius + capitalize(axis) + 'Value', `value.${axis}.value`],
        ])),
        ...bind(exponent, 'Float', radiusState, (buffer) => `${buffer}.getFloat(keys.${exponent})`, [['putFloat', exponent, 'value']]),
      ];
    }),
  ].slice(0, -1);
}

function swiftBorderKeysLines({ borderSides }) {
  return [
    'struct Keys {',
    ...BORDER_SIDE_MEMBERS.map((member) => `  let ${member}: Int`),
    '',
    ...borderSides.flatMap(({ side, fields }) => [
      `  static let ${side} = Keys(`,
      ...fields.map(({ name }, index) => `    ${BORDER_SIDE_MEMBERS[index]}: StyleKeys.${name}${index === fields.length - 1 ? '' : ','}`),
      '  )',
    ]),
    '}',
  ];
}

function swiftBorderAccessorLines(schema) {
  return [
    'public var width: MasonLengthPercentage {',
    '  get { MasonLengthPercentage.fromValueType(owner.getFloat(keys.widthValue), Int(owner.getInt8(keys.widthType)))! }',
    '  set {',
    '    owner.prepareMut()',
    '    owner.setInt8(keys.widthType, newValue.type)',
    '    owner.setFloat(keys.widthValue, newValue.value)',
    '  }',
    '}',
    '',
    'public var style: BorderStyle {',
    '  get { BorderStyle(rawValue: owner.getInt8(keys.style))! }',
    '  set {',
    '    owner.prepareMut()',
    '    owner.setInt8(keys.style, newValue.rawValue)',
    '  }',
    '}',
    '',
    'public var color: UIColor {',
    '  get { UIColor.colorFromARGB(argb) }',
    '  set { setColor(color: newValue.toUInt32()) }',
    '}',
    '',
    'public func setColor(color: UInt32) {',
    '  owner.prepareMut()',
    '  owner.setUInt32(keys.color, color)',
    '}',
    '',
    '/// The resolved color as packed ARGB.',
    'internal var argb: UInt32 {',
    '  let base = owner.getUInt32(keys.color)',
    `  return owner.resolvePseudoUInt32(keys.color, keys.color, base, ${borderState(schema, 'color', 'swift')})`,
    '}',
  ];
}

function tsBorderAccessorLines({ borderSides }) {
  const sideType = borderSides.map(({ side }) => `'${side}'`).join(' | ');
  return [
    'private static readonly borderSideKeys = {',
    ...borderSides.map(({ side, fields }) => `  ${side}: [${fields.map(({ name }) => `StyleKeys.${name}`).join(', ')}],`),
    '} as const;',
    '',
    '// Write the components provided by the shorthand. Its caller commits dirty groups together.',
    `private writeBorderSide(side: ${sideType}, width: number | null, style: number | null, color: number | null) {`,
    '  if (!this.style_view) return;',
    '  const [widthType, widthValue, styleKey, colorKey] = Style.borderSideKeys[side];',
    '  this.prepareMut();',
    '  if (width != null) {',
    '    setInt8(this.style_view, widthType, 0);',
    '    setFloat32(this.style_view, widthValue, width);',
    '  }',
    '  if (style != null) setInt8(this.style_view, styleKey, style);',
    '  if (color != null) setUint32(this.style_view, colorKey, color >>> 0);',
    '}',
    '',
    ...borderSides.flatMap(({ side, fields }) => [
      `get border${capitalize(side)}Color(): string {`,
      `  return new Color(getUint32(this.style_view, StyleKeys.${fields.at(-1).name})).hex;`,
      '}',
      `set border${capitalize(side)}Color(value: number | string | { argb?: number }) {`,
      `  this.setBorderSideColor('${side}', value);`,
      '}',
      '',
    ]),
  ].slice(0, -1);
}

function fieldNote(field) {
  const parts = [];
  if (field.size > 1) parts.push(`${field.type} (${field.offset}-${field.offset + field.size - 1})`);
  if (field.comment) parts.push(field.comment);
  return parts.join(', ');
}

// Renders a section, one line per entry, under one comment style.
function lines(entries, comment, render) {
  const out = [];
  for (const entry of entries) {
    if (entry.kind === 'blank') {
      if (out.length && out[out.length - 1] !== '') out.push('');
    } else if (entry.kind === 'comment') {
      out.push(`${comment} ${entry.text}`);
    } else {
      const text = render(entry);
      if (text == null) continue;
      const note = entry.kind === 'field' ? fieldNote(entry) : entry.comment;
      out.push(note ? `${text} ${comment} ${note}` : text);
    }
  }
  while (out[out.length - 1] === '') out.pop();
  return out;
}

// Lines up trailing comments across consecutive commented lines, as rustfmt does.
function alignComments(out, comment) {
  const marker = ` ${comment} `;
  const result = [...out];
  let start = 0;
  while (start < result.length) {
    if (!result[start].includes(marker) || result[start].startsWith(comment)) {
      start++;
      continue;
    }
    let end = start;
    while (end < result.length && result[end].includes(marker) && !result[end].startsWith(comment)) end++;
    const parts = result.slice(start, end).map((line) => {
      const i = line.indexOf(marker);
      return [line.slice(0, i), line.slice(i + 1)];
    });
    const width = Math.max(...parts.map(([code]) => code.length));
    parts.forEach(([code, note], k) => (result[start + k] = `${code.padEnd(width)} ${note}`));
    start = end;
  }
  return result;
}

function recordLayouts(schema, lang) {
  return schema.recordLayouts.filter(({ name }) =>
    lang === 'rust' || lang === 'kotlin' || !name.startsWith('ANDROID_')).flatMap(({ name, fields }) => {
    const type = `${pascal(name)}Record`;
    const members = [['STRIDE', fields.length], ...fields.map((field, offset) => [field, offset])];
    const render = {
      rust: [`pub struct ${type};`, `impl ${type} {`, (key, value) => `pub const ${key}: usize = ${value};`],
      kotlin: [`internal object ${type} {`, null, (key, value) => `const val ${key} = ${value}`],
      swift: [`enum ${type} {`, null, (key, value) => `static let ${key === 'REPEAT' ? '`repeat`' : camel(key)} = ${value}`],
      cpp: [`namespace ${name.toLowerCase()} {`, null, (key, value) => `inline constexpr uint32_t ${cppName(key)} = ${value};`],
      ts: [`const enum ${type} {`, null, (key, value) => `${key} = ${value},`],
    }[lang];
    const [open, impl, constant] = render;
    const indent = ['kotlin', 'swift', 'ts'].includes(lang) ? '  ' : '    ';
    return [open, ...(impl ? [impl] : []), ...members.map(([key, value]) => indent + constant(key, value)), '}', ''];
  });
}

function rustRecordLines(schema) {
  const kinds = schema.records.map((record) => ({ ...record, variant: pascal(record.name) }));
  const byteRevisions = kinds.filter(({ byteRevision }) => byteRevision).map(({ variant }) => `Self::${variant}`);
  return [
    '#[repr(u8)]',
    '#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]',
    'pub enum StyleRecordKind {',
    ...kinds.map(({ variant, id }) => `    ${variant} = ${id},`),
    '}',
    '',
    'impl StyleRecordKind {',
    `    pub const COUNT: usize = ${kinds.length};`,
    '',
    '    pub fn from_index(value: u8) -> Option<Self> {',
    '        match value {',
    ...kinds.map(({ variant, id }) => `            ${id} => Some(Self::${variant}),`),
    '            _ => None,',
    '        }',
    '    }',
    '',
    '    pub(crate) const fn revision_key(self) -> super::StyleKeys {',
    '        match self {',
    ...kinds.map(({ variant, revision }) => `            Self::${variant} => super::StyleKeys::${revision},`),
    '        }',
    '    }',
    '',
    '    pub(crate) const fn has_byte_revision(self) -> bool {',
    byteRevisions.length ? `        matches!(self, ${byteRevisions.join(' | ')})` : '        false',
    '    }',
    '',
    '    pub(crate) const fn stride(self) -> usize {',
    '        match self {',
    ...kinds.map(({ variant, layout }) => `            Self::${variant} => ${pascal(layout)}Record::STRIDE,`),
    '        }',
    '    }',
    '}',
    '',
    ...recordLayouts(schema, 'rust'),
    '#[repr(u8)]',
    '#[derive(Clone, Copy, Debug)]',
    'pub enum FilterKind {',
    ...schema.filterOperations.map(({ name, id }) => `    ${pascal(name)} = ${id},`),
    '}',
    '',
    'impl FilterKind {',
    '    fn from_name(name: &str) -> Option<Self> {',
    '        match name.to_ascii_lowercase().as_str() {',
    ...schema.filterOperations.map(({ name }) => `            "${name.toLowerCase().replaceAll('_', '-')}" => Some(Self::${pascal(name)}),`),
    '            _ => None,',
    '        }',
    '    }',
    '',
    '    fn from_index(value: u8) -> Option<Self> {',
    '        match value {',
    ...schema.filterOperations.map(({ name, id }) => `            ${id} => Some(Self::${pascal(name)}),`),
    '            _ => None,',
    '        }',
    '    }',
    '}',
    '',
    '#[repr(u8)]',
    '#[derive(Clone, Copy, Debug, PartialEq, Eq)]',
    'pub(super) enum CssParseKind {',
    ...schema.cssParseKinds.map(({ name, id }) => `    ${pascal(name)} = ${id},`),
    '}',
    '',
    'impl CssParseKind {',
    '    fn from_index(value: u8) -> Option<Self> {',
    '        match value {',
    ...schema.cssParseKinds.map(({ name, id }) => `            ${id} => Some(Self::${pascal(name)}),`),
    '            _ => None,',
    '        }',
    '    }',
    '}',
  ];
}

// Layer and border inputs already have ordered Rust record layouts. The write
// batch uses those same slots and appends clip-path after the two input groups.
function maskBindings({ recordLayouts }) {
  const fields = (name) => recordLayouts.find((layout) => layout.name === name).fields;
  const rows = (layout, prefix, group) => fields(layout).map((field) => ({
    group,
    alias: group === 'border' ? `BORDER_${field}` : field,
    css: `${prefix}-${field.toLowerCase().replaceAll('_', '-')}`,
  }));
  const layers = rows('MASK_INPUT', 'mask', 'layer');
  const borders = rows('NINE_SLICE_INPUT', 'mask-border', 'border');
  const clip = { group: 'clip', css: 'clip-path' };
  const paint = [...layers, ...borders];
  for (const [slot, entry] of [...paint, clip].entries()) {
    entry.slot = slot;
    entry.name = camel(entry.css.toUpperCase().replaceAll('-', '_'));
  }
  return { layers, borders, clip, paint, properties: [...layers, clip, ...borders] };
}

const maskName = ({ css }) => JSON.stringify(css);

function rustMaskSlots(schema) {
  const { clip, properties } = maskBindings(schema);
  return [
    `pub(crate) const MASK_CLIP_PATH_SLOT: usize = ${clip.slot};`,
    '',
    'pub(crate) fn mask_style_slot(name: &str) -> Option<usize> {',
    '    match name {',
    ...properties.map((entry) => `        ${maskName(entry)} => Some(${entry.slot}),`),
    '        _ => None,',
    '    }',
    '}',
  ];
}

function kotlinMaskNames(schema) {
  const { paint } = maskBindings(schema);
  return [
    'internal val MASK_CSS_NAMES = arrayOf(',
    ...paint.map((entry) => `  ${maskName(entry)},`),
    ')',
  ];
}

function kotlinMaskConstants(schema) {
  return maskBindings(schema).paint.map(({ alias, slot }) => `const val ${alias} = ${slot}`);
}

function kotlinMaskAccessors(schema) {
  return maskBindings(schema).properties.flatMap(({ alias, group, name }) => [
    `var ${name}: String`,
    ...(group === 'clip' ? [
      '  get() = mClipPath?.get() ?: ""',
      '  set(value) = setClipPathValue(value)',
    ] : [
      `  get() = mMask?.get(Mask.${alias}) ?: ""`,
      `  set(value) = setMaskLonghand(Mask.${alias}, value)`,
    ]),
    '',
  ]).slice(0, -1);
}

function kotlinMaskNodeMethods(schema) {
  return maskBindings(schema).properties.flatMap(({ name }) => {
    const suffix = name[0].toUpperCase() + name.slice(1);
    return [
      `fun get${suffix}(view: android.view.View): String = mason.nodeForView(view).style.${name}`,
      '',
      `fun set${suffix}(view: android.view.View, value: String) {`,
      `  mason.nodeForView(view).style.${name} = value`,
      '}',
      '',
    ];
  }).slice(0, -1);
}

function swiftMaskAccessors(schema) {
  const { properties } = maskBindings(schema);
  return [
    'static let maskPropertyNames = [',
    ...properties.map((entry) => `  ${maskName(entry)},`),
    ']',
    '',
    ...properties.flatMap(({ group, slot, name }) => group === 'clip' ? [
      '@objc public var clipPath: String = "" {',
      '  didSet { updateClipPath(from: oldValue) }',
      '}',
      '',
    ] : [
      `@objc public var ${name}: String {`,
      `  get { maskInputs[${slot}] }`,
      `  set { setMaskInput(${slot}, newValue) }`,
      '}',
      '',
    ]),
  ].slice(0, -1);
}

function tsMaskAccessors(schema) {
  return maskBindings(schema).properties.flatMap(({ css, name, slot }) => {
    const suffix = name[0].toUpperCase() + name.slice(1);
    return [
      `get ${name}(): string {`,
      "  if (!this.nativeView) return '';",
      '  this.flushMaskWrites();',
      `  if (__ANDROID__) return nodeHelper().get${suffix}(this.nativeView);`,
      `  if (__APPLE__) return this.appleStyle.${name};`,
      `  return __WINDOWS__ ? (this._windowsCss.get('${css}') ?? '') : '';`,
      '}',
      '',
      `set ${name}(value: string) {`,
      `  this.setMaskCss('${css}', ${slot}, value);`,
      '}',
      '',
      `get '${css}'() { return this.${name}; }`,
      `set '${css}'(value: string) { this.${name} = value; }`,
      '',
    ];
  }).slice(0, -1);
}

function tsMaskProperties(schema) {
  const { properties, layers, borders } = maskBindings(schema);
  const bindings = properties.flatMap(({ css, name }) => {
    const animated = name === 'maskSize' || name === 'maskPosition';
    return [
      `export const ${name}Property = new Css${animated ? 'Animation' : ''}Property<Style, string>({`,
      `  name: '${name}',`,
      `  cssName: '${css}',`,
      ...(animated ? ['  valueConverter: (value) => value,'] : []),
      '  valueChanged(target, _oldValue, newValue) {',
      '    const view = getViewStyle(target.viewRef);',
      `    if (view) view.${name} = newValue as never;`,
      '  },',
      '});',
      '',
    ];
  });
  const longhands = (name, entries) => [
    `const ${name} = [`,
    ...entries.map(({ name }) => `  ${name}Property,`),
    '];',
  ];
  return [...bindings, ...longhands('maskLonghands', layers), '', ...longhands('maskBorderLonghands', borders)];
}

function windowsMaskNames(schema) {
  const { layers, borders, clip } = maskBindings(schema);
  return [
    `const maskLayerProperties = [${layers.map(maskName).join(', ')}];`,
    `const maskBorderProperties = [${borders.map(maskName).join(', ')}];`,
    `const clipPathProperty = ${maskName(clip)};`,
    '',
    'export const WINDOWS_MASK_PROPERTIES = new Set([...maskLayerProperties, clipPathProperty, ...maskBorderProperties]);',
  ];
}

const RENDER = {
  'rust:layout-math-code': ({ layoutMathType }) => [`pub(crate) const BUFFER_TYPE: i8 = ${layoutMathType};`],
  'rust:layout-math': ({ layoutMath }) => layoutMath.map(({ name, type, value, signed, physical, logical }) => {
    const stamp = physical ? `Stamp::Physical(StyleKeys::${physical.order}, ${physical.length}, ${physical.mask})`
      : logical ? `Stamp::Logical(StyleKeys::${logical.order}, ${logical.slot})` : 'Stamp::None';
    return `"${name}" => (StyleKeys::${type}, StyleKeys::${value}, ${stamp}, ${signed}),`;
  }),
  'ts:layout-math': ({ layoutMath, layoutMathType }) => [
    `const LAYOUT_MATH_TYPE = ${layoutMathType};`,
    '',
    'const logicalLayoutProperties: Record<LogicalGroupName, readonly string[]> = {',
    ...['size', 'margin', 'padding', 'inset'].map((group) => {
      const names = layoutMath.filter(({ logical }) => logical?.order === `${group.toUpperCase()}_ORDER`)
        .sort((a, b) => a.logical.slot - b.logical.slot).map(({ name }) => `'${name}'`);
      return `  ${group}: [${names.join(', ')}],`;
    }),
    '};',
    '',
    'function layoutMathState(property: string): StateKeys | undefined {',
    '  switch (property) {',
    ...layoutMath.map(({ name, state }) => `    case '${name}': return StateKeys.${state};`),
    '  }',
    '}',
  ],
  'rust:mask-slots': rustMaskSlots,
  'rust:mask-keywords': rustMaskKeywords,
  'kotlin:mask-keywords': kotlinMaskKeywords,
  'swift:mask-keywords': swiftMaskKeywords,
  'kotlin:mask-names': kotlinMaskNames,
  'kotlin:mask-constants': kotlinMaskConstants,
  'kotlin:mask-accessors': kotlinMaskAccessors,
  'kotlin:mask-node-methods': kotlinMaskNodeMethods,
  'swift:mask-accessors': swiftMaskAccessors,
  'ts:mask-accessors': tsMaskAccessors,
  'ts:mask-properties': tsMaskProperties,
  'ts:css-math-properties': (schema) => {
    const names = new Set(schema.cssMathProperties);
    for (const { name } of schema.layoutMath) names.add(name);
    for (const { css } of maskBindings(schema).properties) names.add(css);
    for (const { name, tracks } of schema.gridProperties) {
      if (tracks) names.add(name.toLowerCase().replaceAll('_', '-'));
    }
    return ['const cssMathProperties = new Set<string>([', ...[...names].sort().map((name) => `  '${name}',`), ']);'];
  },
  'ts:windows-mask-names': windowsMaskNames,
  'rust:grid-properties': ({ gridProperties }) => [
    'const GRID_PROPERTIES: &[fn(&mut Style, &str, LengthContext)] = &[',
    ...gridProperties.map(({ name, tracks }) => {
      const method = `set_${name.toLowerCase()}${name === 'GRID_AREA' ? '' : '_css'}`;
      return tracks
        ? `    Style::${method}_with_context,`
        : `    |style, value, _| style.${method}(value),`;
    }),
    '];',
  ],
  'ts:grid-properties': ({ gridProperties }) => [
    'const enum GridProperty {',
    ...gridProperties.map(({ name, id }) => `  ${pascal(name)} = ${id},`),
    '}',
  ],
  'swift:grid-accessors': ({ gridProperties }) => gridProperties.flatMap(({ name, id }) => [
    `public var ${camel(name)}: String {`,
    `  get { readGridCss(${id}) { NativeHelpers.toSwiftString { mason_style_get_${name.toLowerCase()}_css(node.mason.nativePtr, node.nativePtr) } ?? "" } }`,
    `  set { queueGridCss(${id}, newValue) }`,
    '}',
    '',
  ]).slice(0, -1),
  'kotlin:grid-accessors': ({ gridProperties }) => gridProperties.flatMap(({ name, id }) => [
    `var ${camel(name)}: String`,
    `  get() = readGridCss(${id}) { nativeGet${pascal(name)}(node.mason.nativePtr, node.nativePtr) ?: "" }`,
    `  set(value) = queueGridCss(${id}, value)`,
    '',
  ]).slice(0, -1),
  'ts:writes': (s) => writerLines(s, 'ts'),
  'ts:accessors': (s) => [...accessorLines(s, 'ts'), '', ...windowsDecorationWriterLines(s), '', ...windowsCornerWriterLines(s)],
  'ts:border-accessors': tsBorderAccessorLines,
  'ts:border-style-codes': (s) => [
    'const enum BorderStyleCode {',
    ...borderStyleKeywords(s).map(([name, { code }]) => `  ${capitalize(name)} = ${code},`),
    '}',
  ],
  'rust:border-style': rustBorderStyleLines,
  'rust:border-style-conversions': rustBorderStyleConversionLines,
  'kotlin:border-style-values': (s) => borderStyleKeywords(s).map(([name, { code }], index, entries) =>
    `${capitalize(name)}(${code}, "${name}")${index === entries.length - 1 ? ';' : ','}`),
  'kotlin:border-style-conversions': (s) => [
    'fun from(value: Byte): BorderStyle = when (value) {',
    ...borderStyleKeywords(s).map(([name, { code }]) => `  ${code}.toByte() -> ${capitalize(name)}`),
    '  else -> throw IllegalArgumentException("Unknown enum value: $value")',
    '}',
  ],
  'swift:border-style-conversions': swiftBorderStyleCodeLines,
  'kotlin:border-keys': kotlinBorderKeysLines,
  'kotlin:border-accessors': kotlinBorderAccessorLines,
  'swift:border-keys': swiftBorderKeysLines,
  'swift:border-accessors': swiftBorderAccessorLines,
  'ts:records': (s) => recordLayouts({
    recordLayouts: s.recordLayouts.filter(({ name }) =>
      ['BORDER_RADII', 'CSS_LENGTH_RESULT', 'CSS_BACKGROUND_WRITE', 'CSS_EFFECT_WRITE', 'CSS_MASK_WRITE'].includes(name)),
  }, 'ts').slice(0, -1),
  'ts:animation-records': (s) => recordLayouts({
    recordLayouts: s.recordLayouts.filter(({ name }) => name.startsWith('CSS_ANIMATION_')),
  }, 'ts').slice(0, -1),
  'ts:css-parse-kinds': (s) => [
    'enum CssParseKind {',
    ...s.cssParseKinds.map(({ name, id }) => `  ${pascal(name)} = ${id},`),
    '}',
  ],
  'ts:filter-operations': (s) => [
    'enum FilterKind {',
    ...s.filterOperations.map(({ name, id }) => `  ${pascal(name)} = ${id},`),
    '}',
  ],
  'kotlin:writes': (s) => writerLines(s, 'kotlin'),
  'swift:writes': (s) => writerLines(s, 'swift'),
  'kotlin:accessors': (s) => accessorLines(s, 'kotlin'),
  'swift:accessors': (s) => accessorLines(s, 'swift'),
  'kotlin:native-methods': (s) => lengthSetterLines(s, 'kotlin').slice(0, -1),
  'swift:native-methods': (s) => [
    ...s.accessors.filter((entry) => entry.compat).flatMap(swiftCompatLines),
    ...lengthSetterLines(s, 'swift'),
  ].slice(0, -1),
  'rust:offsets': (s) => alignComments(lines(s.style, '//', (f) => `${f.name} = ${f.offset},`), '//'),
  'rust:state': (s) => alignComments(lines(s.state, '//', (b) => `const ${stateName(b, 'rust')} = 1u128 << ${b.bit};`), '//'),
  'rust:size': (s) => [`pub const STYLE_BUFFER_SIZE: usize = ${s.bufferSize};`],
  'rust:records': rustRecordLines,
  'rust:keywords': rustKeywordLines,

  'kotlin:offsets': (s) => [`const val STYLE_BUFFER_SIZE = ${s.bufferSize}`, '', ...lines(s.style, '//', (f) => `const val ${f.name} = ${f.offset}`)],
  'kotlin:state': (s) => lines(s.state, '//', (b) => (stateName(b, 'kotlin') ? `val ${stateName(b, 'kotlin')} = flag(${b.bit})` : null)),
  'kotlin:state-groups': (s) => stateGroupLines(s, 'kotlin'),
  'kotlin:records': (s) => [
    'internal enum class StyleRecordKind(val id: Int) {',
    ...s.records.map(({ name, id }) => `  ${name}(${id}),`),
    '}',
    '',
    ...recordLayouts(s, 'kotlin'),
    'internal object FilterOperationCode {',
    ...s.filterOperations.map(({ name, id }) => `  const val ${name} = ${id}`),
    '}',
    '',
    'internal object CssParseKind {',
    ...s.cssParseKinds.map(({ name, id }) => `  const val ${name} = ${id}`),
    '}',
  ],

  'swift:offsets': (s) => [`public static let STYLE_BUFFER_SIZE = ${s.bufferSize}`, '', ...lines(s.style, '//', (f) => `public static let ${f.name} = ${f.offset}`)],
  'swift:state': (s) => lines(s.state, '//', (b) => (stateName(b, 'swift') ? `public static let ${stateName(b, 'swift')} = StateKeys(${b.bit})` : null)),
  'swift:state-groups': (s) => stateGroupLines(s, 'swift'),
  'swift:records': (s) => [
    'enum StyleRecordKind: UInt8 {',
    ...s.records.map(({ name, id }) => `  case ${camel(name)} = ${id}`),
    '}',
    '',
    ...recordLayouts(s, 'swift'),
    'enum FilterOperationCode {',
    ...s.filterOperations.map(({ name, id }) => `  static let ${camel(name)} = ${id}`),
    '}',
    '',
    'enum CssParseKind: UInt8 {',
    ...s.cssParseKinds.map(({ name, id }) => `  case ${camel(name)} = ${id}`),
    '}',
  ],

  'ts:offsets': (s) => [`STYLE_BUFFER_SIZE = ${s.bufferSize},`, '', ...lines(s.style, '//', (f) => `${f.name} = ${f.offset},`)],
  'ts:state': (s) => lines(s.state, '//', (b) => (stateName(b, 'ts') ? `static readonly ${stateName(b, 'ts')} = StateKeys.flag(${b.bit});` : null)),
  'ts:state-groups': (s) => stateGroupLines(s, 'ts'),
};

const NATIVE = 'packages/nativescript-masonkit/src-native';
const REGIONS = [
  { file: 'crates/mason-core/src/style/css/layout_length.rs', blocks: ['rust:layout-math-code', 'rust:layout-math'] },
  { file: 'crates/mason-core/src/style/mod.rs', blocks: ['rust:offsets', 'rust:state', 'rust:border-style'] },
  { file: 'crates/mason-core/src/utils/mod.rs', blocks: ['rust:border-style-conversions'] },
  { file: 'crates/mason-core/src/style/arena.rs', blocks: ['rust:size'] },
  { file: 'crates/mason-core/src/style/css.rs', blocks: ['rust:records', 'rust:mask-slots'] },
  { file: 'crates/mason-core/src/style/css/mask.rs', blocks: ['rust:mask-keywords'] },
  { file: 'crates/mason-core/src/style/css/keywords.rs', blocks: ['rust:keywords'] },
  { file: 'crates/mason-core/src/style/css/grid.rs', blocks: ['rust:grid-properties'] },
  { file: `${NATIVE}/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/Style.kt`, blocks: ['kotlin:offsets', 'kotlin:state', 'kotlin:state-groups', 'kotlin:writes', 'kotlin:records', 'kotlin:accessors', 'kotlin:grid-accessors', 'kotlin:native-methods', 'kotlin:mask-accessors'] },
  { file: `${NATIVE}/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/NodeHelper.kt`, blocks: ['kotlin:mask-node-methods'] },
  { file: 'packages/nativescript-masonkit/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/Mask.kt', blocks: ['kotlin:mask-names', 'kotlin:mask-constants', 'kotlin:mask-keywords'] },
  { file: 'packages/nativescript-masonkit/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/Border.kt', blocks: ['kotlin:border-keys', 'kotlin:border-accessors'] },
  { file: 'packages/nativescript-masonkit/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/enums/BorderStyle.kt', blocks: ['kotlin:border-style-values', 'kotlin:border-style-conversions'] },
  { file: `${NATIVE}/mason-ios/Mason/Mason/MasonStyle.swift`, blocks: ['swift:offsets', 'swift:state', 'swift:state-groups', 'swift:writes', 'swift:records', 'swift:accessors', 'swift:grid-accessors', 'swift:native-methods', 'swift:mask-accessors'] },
  { file: 'packages/nativescript-masonkit/src-native/mason-ios/Mason/Mason/Border.swift', blocks: ['swift:border-keys', 'swift:border-accessors', 'swift:border-style-conversions'] },
  { file: 'packages/nativescript-masonkit/src-native/mason-ios/Mason/Mason/Mask.swift', blocks: ['swift:mask-keywords'] },
  { file: 'packages/nativescript-masonkit/style.ts', blocks: ['ts:offsets', 'ts:state', 'ts:state-groups', 'ts:writes', 'ts:accessors', 'ts:css-parse-kinds', 'ts:records', 'ts:grid-properties', 'ts:mask-accessors', 'ts:border-accessors', 'ts:border-style-codes', 'ts:layout-math'] },
  { file: 'packages/nativescript-masonkit/css-keyframes.ts', blocks: ['ts:animation-records'] },
  { file: 'packages/nativescript-masonkit/css-filter.ts', blocks: ['ts:filter-operations'] },
  { file: 'packages/nativescript-masonkit/properties.ts', blocks: ['ts:mask-properties', 'ts:css-math-properties'] },
  { file: 'packages/nativescript-masonkit/mask.windows.ts', blocks: ['ts:windows-mask-names'] },
];

function cppHeader(s) {
  const field = lines(s.style, '//', (f) => `inline constexpr uint32_t ${cppName(f.name)} = ${f.offset};`);
  const state = lines(s.state, '//', (b) => (stateName(b, 'cpp') ? `inline constexpr uint32_t ${stateName(b, 'cpp')} = ${b.bit};` : null));
  const indent = (l) => (l ? `    ${l}` : l);
  const rustOwned = s.style.filter((field) => field.rustOwned);
  return [
    `// Generated from ${SCHEMA_REL} by tools/scripts/style-keys/generate.mjs. Do not edit.`,
    '#pragma once',
    '#include <array>',
    '#include <cstdint>',
    '',
    '// Byte offsets into the shared style buffer.',
    'namespace mason_style_keys',
    '{',
    indent(`inline constexpr uint32_t kStyleBufferSize = ${s.bufferSize};`),
    '',
    ...field.map(indent),
    '',
    indent('struct BorderCorner { uint32_t xType, xValue, yType, yValue, exponent; };'),
    indent(`inline constexpr std::array<BorderCorner, ${s.borderCorners.size}> kBorderCorners{{`),
    ...[...s.borderCorners.values()].map(({ radius, exponent }) =>
      indent(`    { ${[...radius, exponent].map(({ name }) => cppName(name)).join(', ')} },`)),
    indent('}};'),
    '',
    indent('struct FieldRange { uint32_t offset, size; };'),
    indent(`inline constexpr std::array<FieldRange, ${rustOwned.length}> kRustOwnedFields{{`),
    ...rustOwned.map(({ name, size }) => indent(`    { ${cppName(name)}, ${size} },`)),
    indent('}};'),
    '}',
    '',
    '// Bit numbers of the 128-bit style dirty mask.',
    'namespace mason_state_keys',
    '{',
    ...state.map(indent),
    '}',
    '',
    'namespace mason_state_groups',
    '{',
    ...stateGroupLines(s, 'cpp').map(indent),
    '}',
    '',
    'namespace mason_css_records',
    '{',
    ...s.records.map(({ name, id }) => indent(`inline constexpr uint8_t ${cppName(name)} = ${id};`)),
    '',
    ...recordLayouts(s, 'cpp').slice(0, -1).map(indent),
    '}',
    '',
    'namespace mason_css_parse_kinds',
    '{',
    ...s.cssParseKinds.map(({ name, id }) => indent(`inline constexpr uint8_t ${cppName(name)} = ${id};`)),
    indent(`inline constexpr int32_t kCount = ${s.cssParseKinds.length};`),
    '}',
    '',
  ].join('\n');
}

const FILES = [
  { file: `${NATIVE}/windows/Mason/StyleKeys.h`, render: cppHeader },
];

function fillRegions(source, file, blocks, schema) {
  let out = source;
  for (const block of blocks) {
    const name = block.split(':')[1];
    const lineList = out.split('\n');
    const begin = lineList.findIndex((l) => l.includes(`<style-keys:${name}>`));
    const end = lineList.findIndex((l) => l.includes(`</style-keys:${name}>`));
    if (begin < 0 || end < begin) throw new Error(`${file}: missing <style-keys:${name}> ... </style-keys:${name}> markers`);
    const indent = /^\s*/.exec(lineList[begin])[0];
    const body = RENDER[block](schema).map((l) => (l ? indent + l : l));
    lineList.splice(begin + 1, end - begin - 1, ...body);
    out = lineList.join('\n');
  }
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  const read = (path) => readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
  const schema = parseSchema(read(SCHEMA));
  const outputs = [];
  for (const { file, blocks } of REGIONS) {
    const path = resolve(root, file);
    const before = read(path);
    outputs.push({ file, path, before, after: fillRegions(before, file, blocks, schema) });
  }
  for (const { file, render } of FILES) {
    const path = resolve(root, file);
    const before = existsSync(path) ? read(path) : '';
    outputs.push({ file, path, before, after: render(schema) });
  }

  const stale = outputs.filter((o) => o.before !== o.after);
  const fields = schema.style.filter((e) => e.kind === 'field').length;
  const bits = schema.state.filter((e) => e.kind === 'bit').length;
  if (check) {
    if (stale.length) {
      console.error(`StyleKeys are stale in:\n${stale.map((o) => `  ${o.file}`).join('\n')}\nRun \`npm run gen:style-keys\` and commit the result.`);
      process.exit(1);
    }
    console.log(`StyleKeys up to date: ${fields} fields, ${bits} state bits, buffer ${schema.bufferSize} bytes.`);
    return;
  }
  for (const o of stale) writeFileSync(o.path, o.after);
  console.log(`${fields} fields, ${bits} state bits, buffer ${schema.bufferSize} bytes. Updated ${stale.length} file(s)${stale.length ? `:\n${stale.map((o) => `  ${o.file}`).join('\n')}` : '.'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
